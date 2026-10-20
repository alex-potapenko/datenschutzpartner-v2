import { http, HttpResponse } from 'msw';
import type { Contact, ContactCreate } from '@/api/contacts';
import type { ContactMessage, ContactMessageCreate } from '@/api/contact-messages';
import type {
  AffiliateAdminPartner,
  AffiliateAdminPayout,
  AffiliateAdminReferral,
  AffiliateApplication,
  AffiliateApplicationCreate,
  AffiliateDashboard,
  AffiliatePartner,
  AffiliatePayout,
  AffiliatePayoutPreview,
  AffiliatePayoutRequest,
  AffiliateReferralLink,
  AffiliateVisit,
  AffiliateCampaignStats,
  AffiliateProgramSettings,
} from '@/api/affiliate';
import {
  AFFILIATE_CAMPAIGN_PATTERN,
  AFFILIATE_MAX_COMMISSION_PERCENT,
  affiliateProgramSettingsSchema,
  AFFILIATE_SLUG_PATTERN,
  affiliateReferralStatusSchema,
} from '@/api/affiliate';
import { normalizeAffiliateTargetPath, safeTargetPath } from '@/lib/affiliate-attribution';
import {
  affiliateConversionRate,
  roundChf,
  selectPayoutReferrals,
  summarizeAffiliateReferrals,
} from '@/lib/affiliate-ledger';
import {
  AFFILIATE_PROGRAM_SETTINGS,
  createAffiliateDemoHistory,
  createAffiliatePartnerRecord,
  createAffiliateSeed,
  partnerReferralUrl,
  referralLinkUrl,
  slugFromEmail,
  type AffiliatePartnerRecord,
  type AffiliatePayoutRecord,
  type AffiliateReferralLinkRecord,
  type AffiliateReferralRecord,
  type AffiliateVisitRecord,
} from '@/mocks/affiliate-data';
import type {
  AccountRole,
  ForgotPasswordInput,
  InviteValidation,
  LoginIdentifyInput,
  LoginInput,
  LoginResponse,
  RegisterInput,
  Session,
  VerifyEmailInput,
} from '@/api/auth';
import type { TwoFactorActivation, TwoFactorSetup, TwoFactorStatus } from '@/api/two-factor';
import { buildOtpauthUri, generateTotpCode, generateTotpSecret, verifyTotpCode } from '@/lib/totp';
import { generateRecoveryCodes, recoveryCodesMatch } from '@/lib/recovery-codes';
import type { BillingAddress, AccountSnapshot, PasswordChange, Profile } from '@/api/account';
import type {
  Order,
  Subscription,
  SubscriptionBillingUpdate,
  EuRepExtraRequestCreate,
  EuRepExtraRequestWithdraw,
} from '@/api/billing';
import {
  isPolicySubscriptionOnTrial,
  isEuRepSubscriptionOnTrial,
  countActivePolicySites,
  countActivePolicySubscriptions,
  resolvePolicySiteCount,
  subscriptionGrantsProductAccess,
} from '@/api/billing';
import type { CheckoutSessionCreate, CheckoutSessionDetails, EuRepPlanId } from '@/api/checkout';
import {
  calculateEuRepQuote,
  calculateGeneratorPolicyQuote,
  POLICY_TRIAL_DAYS,
  calculateSubscriptionRenewalQuote,
  qualifyingSiteCountForCheckout,
  resolveEuRepPlan,
} from '@/api/checkout';
import {
  applyPromoDiscount,
  calculatePromoDiscountAmount,
  normalizePromoCode,
  resolvePromoCode,
} from '@/lib/promo-codes';
import type { GeneratedDocument, PolicyVersion } from '@/api/documents';
import {
  buildHostedPolicyPath,
  countAvailablePolicySlots,
  formatSiteDomain,
  normalizeGeneratedDocument,
  resolveDocumentSite,
  resolveHostedPolicySlug,
  uniqueDocumentsBySite,
} from '@/api/documents';
import type {
  PolicyBasicInformation,
  PolicyMaintenanceState,
  PolicyScanSettings,
  PolicyService,
  PolicyServiceRequest,
  PolicyServiceRequestCreate,
  PolicyUpdateSource,
} from '@/api/policy-updates';
import {
  findPolicyServiceCatalogEntry,
  POLICY_SERVICE_CATALOG,
} from '@/lib/policy-services/catalog';
import { extractDomainHost } from '@/lib/validation/url';
import { euRepAccountHref, privacyPolicyAccountHref } from '@/lib/account-routes';
import type {
  EuRepContract,
  EuRepContractCreate,
  EuRepContractUpdate,
  EuRepLinkDocuments,
} from '@/api/eu-rep';
import type { UidCompany } from '@/api/uid-registry';
import { createCollection } from './db';

function tokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

function isMemberToken(token: string | null): boolean {
  return token === 'mock-member-token';
}

function isVerifiedAccount(token: string | null): boolean {
  return Boolean(emailFromLoginToken(token));
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const MOCK_MEMBER_EMAIL = 'lucas.baumgartner@gmail.com';
const MOCK_MEMBER_PASSWORD = 'mpdsp';
const MOCK_ADMIN_EMAIL = 'admin@datenschutzpartner.ch';
const MOCK_ADMIN_PASSWORD = 'dspmp';
const TWO_FACTOR_ISSUER = 'Datenschutzpartner';
/** Default password for accounts created after email verification in the prototype. */
const PROTOTYPE_REGISTERED_PASSWORD = 'welcome';

type RecoveryCodeRecord = {
  code: string;
  usedAt: string | null;
};

type AuthAccountRecord = {
  id: string;
  email: string;
  password: string;
  role: AccountRole;
  /** Set once setup is confirmed — its presence is what enables 2FA. */
  totpSecret: string | null;
  /** Issued by /setup, promoted to totpSecret by /activate. */
  pendingTotpSecret: string | null;
  twoFactorActivatedAt: string | null;
  recoveryCodes: RecoveryCodeRecord[];
  /** Policy flag: these accounts cannot sign in before 2FA is configured. */
  twoFactorRequired: boolean;
  /** Optional nudge to configure 2FA after sign-in (member accounts). */
  twoFactorSetupSuggested: boolean;
  /** Member sign-in preference — password mode enables 2FA in account settings. */
  memberSignInMethod: 'magic_link' | 'password';
};

function createAuthAccountsSeed(): AuthAccountRecord[] {
  return [
    {
      id: '1',
      email: MOCK_MEMBER_EMAIL,
      password: MOCK_MEMBER_PASSWORD,
      role: 'member',
      totpSecret: null,
      pendingTotpSecret: null,
      twoFactorActivatedAt: null,
      recoveryCodes: [],
      twoFactorRequired: false,
      twoFactorSetupSuggested: true,
      memberSignInMethod: 'magic_link',
    },
    {
      id: '2',
      email: MOCK_ADMIN_EMAIL,
      password: MOCK_ADMIN_PASSWORD,
      role: 'admin',
      totpSecret: null,
      pendingTotpSecret: null,
      twoFactorActivatedAt: null,
      recoveryCodes: [],
      twoFactorRequired: false,
      twoFactorSetupSuggested: false,
      memberSignInMethod: 'password',
    },
  ];
}

function resolveMemberSignInMethod(account: AuthAccountRecord | undefined) {
  if (!account || account.role !== 'member') return undefined;
  return account.memberSignInMethod;
}

const authAccounts = createCollection<AuthAccountRecord>(
  'auth-accounts',
  createAuthAccountsSeed(),
  8
);

function shouldSuggestTwoFactorSetup(account: AuthAccountRecord | undefined): boolean {
  if (!account || account.role !== 'member') return false;
  if (isTwoFactorEnabled(account)) return false;
  if (resolveMemberSignInMethod(account) === 'magic_link') return false;
  return account.twoFactorSetupSuggested;
}

type MagicLoginTokenRecord = {
  id: string;
  token: string;
  email: string;
  createdAt: string;
  consumedAt: string | null;
};

const magicLoginTokens = createCollection<MagicLoginTokenRecord>('auth-magic-login-tokens', []);

function issueMagicLoginToken(email: string): MagicLoginTokenRecord {
  const normalized = email.trim().toLowerCase();
  return magicLoginTokens.create({
    token: `magic-${normalized.replace(/[^a-z0-9]/gi, '-')}-${String(Date.now())}`,
    email: normalized,
    createdAt: new Date().toISOString(),
    consumedAt: null,
  });
}

function isTwoFactorEnabled(account: AuthAccountRecord): boolean {
  return Boolean(account.totpSecret);
}

function twoFactorFlags(account: AuthAccountRecord) {
  return {
    requiresTwoFactor: isTwoFactorEnabled(account),
    twoFactorSetupRequired: account.twoFactorRequired && !isTwoFactorEnabled(account),
  };
}

function twoFactorStatus(account: AuthAccountRecord): TwoFactorStatus {
  return {
    enabled: isTwoFactorEnabled(account),
    required: account.twoFactorRequired,
    activatedAt: account.twoFactorActivatedAt,
    recoveryCodesRemaining: account.recoveryCodes.filter((entry) => !entry.usedAt).length,
    recoveryCodesTotal: account.recoveryCodes.length,
  };
}

/** Recovery codes are single use — matching one also burns it. */
function consumeRecoveryCode(account: AuthAccountRecord, candidate: string): boolean {
  const match = account.recoveryCodes.find(
    (entry) => !entry.usedAt && recoveryCodesMatch(entry.code, candidate)
  );
  if (!match) return false;

  authAccounts.update(account.id, {
    recoveryCodes: account.recoveryCodes.map((entry) =>
      entry.code === match.code ? { ...entry, usedAt: new Date().toISOString() } : entry
    ),
  });
  return true;
}

/**
 * Setup tokens authorise the two-factor endpoints for users who have no
 * session yet: invited accounts and admins forced into setup at login.
 */
type SetupTokenRecord = {
  id: string;
  token: string;
  email: string;
  needsPassword: boolean;
  createdAt: string;
  consumedAt: string | null;
};

const setupTokens = createCollection<SetupTokenRecord>('auth-setup-tokens', []);

function issueSetupToken(email: string, needsPassword: boolean): SetupTokenRecord {
  const normalized = email.trim().toLowerCase();
  const existing = setupTokens
    .all()
    .find(
      (row) => row.email === normalized && !row.consumedAt && row.needsPassword === needsPassword
    );
  if (existing) return existing;

  return setupTokens.create({
    token: `setup-${normalized.replace(/[^a-z0-9]/gi, '-')}-${String(Date.now())}`,
    email: normalized,
    needsPassword,
    createdAt: new Date().toISOString(),
    consumedAt: null,
  });
}

function findSetupToken(token: string | undefined): SetupTokenRecord | undefined {
  if (!token) return undefined;
  return setupTokens.all().find((row) => row.token === token && !row.consumedAt);
}

/**
 * Two-factor endpoints accept either a session (account settings) or a setup
 * token (e-mail link). Anything else is unauthorised.
 */
function resolveTwoFactorAccount(
  request: Request,
  setupToken?: string
): AuthAccountRecord | undefined {
  const fromToken = findSetupToken(setupToken);
  if (fromToken) {
    return findAuthAccountByEmail(fromToken.email);
  }

  const email = emailFromLoginToken(tokenFromRequest(request));
  return email ? findAuthAccountByEmail(email) : undefined;
}

function findAuthAccountByEmail(email: string): AuthAccountRecord | undefined {
  const normalized = email.trim().toLowerCase();
  return authAccounts.all().find((row) => row.email === normalized);
}

function accountRole(email: string): AccountRole | null {
  return findAuthAccountByEmail(email)?.role ?? null;
}

function ensureAuthAccount(
  email: string,
  role: AccountRole = 'member',
  password = PROTOTYPE_REGISTERED_PASSWORD
): AuthAccountRecord {
  const normalized = email.trim().toLowerCase();
  const existing = findAuthAccountByEmail(normalized);
  if (existing) return existing;

  return authAccounts.create({
    email: normalized,
    password,
    role,
    totpSecret: null,
    pendingTotpSecret: null,
    twoFactorActivatedAt: null,
    recoveryCodes: [],
    twoFactorRequired: role === 'admin',
    twoFactorSetupSuggested: false,
    memberSignInMethod: role === 'member' ? 'magic_link' : 'password',
  });
}

function loginTokenForEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized === MOCK_MEMBER_EMAIL) return 'mock-member-token';
  if (normalized === MOCK_ADMIN_EMAIL) return 'mock-token';
  return `mock-email-${encodeURIComponent(normalized)}`;
}

function emailFromLoginToken(token: string | null): string | null {
  if (!token) return null;
  if (token === 'mock-member-token') return MOCK_MEMBER_EMAIL;
  if (token === 'mock-token') return MOCK_ADMIN_EMAIL;
  if (token.startsWith('mock-email-')) {
    return decodeURIComponent(token.slice('mock-email-'.length));
  }
  if (token.startsWith('mock-verified-')) {
    const pending = pendingRegistrations
      .all()
      .find((row) => `mock-verified-${row.verificationToken}` === token);
    return pending?.email ?? null;
  }
  return null;
}

/**
 * Mock API — this is the draft API contract the prototype designs.
 * Keep handlers in sync with the zod schemas in api/. At handover the
 * backend implements this contract and these handlers are deleted.
 *
 * Data is stored via createCollection, so edits survive page reloads in
 * the browser (localStorage) but reset between tests (in-memory in node).
 */
const contacts = createCollection<Contact>('contacts', [
  { id: '1', name: 'Anna Keller', email: 'anna.keller@example.ch', company: 'Helvetia AG' },
  { id: '2', name: 'Luca Bernasconi', email: 'luca.bernasconi@example.ch', company: 'Ticino SA' },
]);

const contactMessages = createCollection<ContactMessage>('contact-messages', []);

const affiliateSeed = createAffiliateSeed();

const affiliateApplications = createCollection<AffiliateApplication>(
  'affiliate-applications',
  affiliateSeed.applications,
  5
);
const affiliatePartners = createCollection<AffiliatePartnerRecord>(
  'affiliate-partners',
  affiliateSeed.partners,
  5
);
const affiliateReferralLinks = createCollection<AffiliateReferralLinkRecord>(
  'affiliate-referral-links',
  affiliateSeed.links,
  5
);
const affiliateVisits = createCollection<AffiliateVisitRecord>(
  'affiliate-visits',
  affiliateSeed.visits,
  3
);
const affiliateReferrals = createCollection<AffiliateReferralRecord>(
  'affiliate-referrals',
  affiliateSeed.referrals,
  3
);
const affiliatePayouts = createCollection<AffiliatePayoutRecord>(
  'affiliate-payouts',
  affiliateSeed.payouts,
  6
);

const affiliateSettings = createCollection<AffiliateProgramSettings & { id: string }>(
  'affiliate-settings',
  [{ id: 'program', ...AFFILIATE_PROGRAM_SETTINGS }],
  1
);

function programSettings(): AffiliateProgramSettings {
  const stored = affiliateSettings.all()[0];
  if (!stored) return AFFILIATE_PROGRAM_SETTINGS;
  return affiliateProgramSettingsSchema.parse(stored);
}

function sessionEmail(request: Request): string | null {
  return emailFromLoginToken(tokenFromRequest(request));
}

function sessionRole(request: Request): AccountRole {
  const email = sessionEmail(request);
  if (!email) return 'member';
  return accountRole(email) ?? 'member';
}

function requireSessionEmail(request: Request): string | null {
  return sessionEmail(request);
}

function requireAdmin(request: Request): boolean {
  return sessionRole(request) === 'admin';
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

function findPartnerByEmail(email: string) {
  return affiliatePartners.all().find((row) => row.email.toLowerCase() === email.toLowerCase());
}

function findPartnerById(id: string) {
  return affiliatePartners.all().find((row) => row.id === id);
}

function findPartnerBySlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return affiliatePartners.all().find((row) => row.slug.toLowerCase() === normalized);
}

function isPartnerSlugTaken(slug: string, exceptPartnerId?: string) {
  const partner = findPartnerBySlug(slug);
  return Boolean(partner && partner.id !== exceptPartnerId);
}

function partnerLinks(partnerId: string) {
  return affiliateReferralLinks
    .all()
    .filter((row) => row.partnerId === partnerId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function partnerVisits(partnerId: string) {
  return affiliateVisits
    .all()
    .filter((row) => row.partnerId === partnerId)
    .sort(byNewest);
}

function partnerReferrals(partnerId: string) {
  return affiliateReferrals
    .all()
    .filter((row) => row.partnerId === partnerId)
    .sort(byNewest);
}

function partnerPayouts(partnerId: string) {
  return affiliatePayouts
    .all()
    .filter((row) => row.partnerId === partnerId)
    .sort(byNewest);
}

function partnerDto(partner: AffiliatePartnerRecord): AffiliatePartner {
  return {
    id: partner.id,
    applicationId: partner.applicationId,
    email: partner.email,
    slug: partner.slug,
    referralUrl: partnerReferralUrl(partner.slug),
    approvedAt: partner.approvedAt,
    commissionRate: partner.commissionRate,
    notificationEmail: partner.notificationEmail,
    notifyOnReferral: partner.notifyOnReferral,
    status: partner.status,
    deactivatedAt: partner.deactivatedAt,
  };
}

function referralLinkDto(
  link: AffiliateReferralLinkRecord,
  partner: AffiliatePartnerRecord
): AffiliateReferralLink {
  const referrals = affiliateReferrals
    .all()
    .filter((row) => row.linkId === link.id && row.status !== 'rejected');
  return {
    id: link.id,
    targetPath: link.targetPath,
    campaign: link.campaign,
    referralUrl: referralLinkUrl(partner.slug, link),
    createdAt: link.createdAt,
    clicks: affiliateVisits.all().filter((row) => row.linkId === link.id).length,
    conversions: referrals.length,
    earningsChf: roundChf(referrals.reduce((sum, row) => sum + row.commissionChf, 0)),
  };
}

function payoutDto(row: AffiliatePayoutRecord): AffiliatePayout {
  return {
    id: row.id,
    amountChf: row.amountChf,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    referralCount: row.referralIds.length,
    status: row.status,
    createdAt: row.createdAt,
    transferredAt: row.transferredAt,
  };
}

function adminPayoutDto(row: AffiliatePayoutRecord): AffiliateAdminPayout | null {
  const partner = findPartnerById(row.partnerId);
  if (!partner) return null;
  return {
    ...payoutDto(row),
    partnerId: partner.id,
    partnerEmail: partner.email,
    partnerSlug: partner.slug,
    referralIds: row.referralIds,
    referralReferences: row.referralIds.map(
      (id) => affiliateReferrals.all().find((referral) => referral.id === id)?.reference ?? id
    ),
    createdBy: row.createdBy,
    transferredBy: row.transferredBy,
    method: 'manual',
    invoiceEmailSentTo: row.invoiceEmailSentTo,
  };
}

function adminReferralDto(row: AffiliateReferralRecord): AffiliateAdminReferral | null {
  const partner = findPartnerById(row.partnerId);
  if (!partner) return null;
  return {
    id: row.id,
    partnerId: partner.id,
    partnerEmail: partner.email,
    partnerSlug: partner.slug,
    reference: row.reference,
    description: row.description,
    orderAmountChf: row.orderAmountChf,
    commissionChf: row.commissionChf,
    status: row.status,
    createdAt: row.createdAt,
    payoutId: row.payoutId,
  };
}

function partnerActivity(partner: AffiliatePartnerRecord) {
  const visits = partnerVisits(partner.id).length;
  const summary = summarizeAffiliateReferrals(partnerReferrals(partner.id));
  return { visits, summary };
}

function partnerDashboard(email: string): AffiliateDashboard | null {
  const partner = findPartnerByEmail(email);
  return partner ? partnerDashboardFor(partner) : null;
}

function partnerDashboardFor(partner: AffiliatePartnerRecord): AffiliateDashboard {
  const { visits, summary } = partnerActivity(partner);
  return {
    partner: partnerDto(partner),
    referralLinks: partnerLinks(partner.id).map((link) => referralLinkDto(link, partner)),
    stats: {
      visits,
      conversionRate: affiliateConversionRate(visits, summary),
      referralCounts: summary.counts,
      pendingEarningsChf: summary.pendingChf,
      unpaidEarningsChf: summary.unpaidChf,
      paidEarningsChf: summary.paidChf,
    },
    payoutThresholdChf: programSettings().payoutThresholdChf,
    payouts: partnerPayouts(partner.id).map(payoutDto),
    referrals: partnerReferrals(partner.id).map((row) => ({
      id: row.id,
      reference: row.reference,
      description: row.description,
      commissionChf: row.commissionChf,
      status: row.status,
      createdAt: row.createdAt,
    })),
  };
}

function adminPartnerDto(partner: AffiliatePartnerRecord): AffiliateAdminPartner {
  const { visits, summary } = partnerActivity(partner);
  return {
    id: partner.id,
    email: partner.email,
    slug: partner.slug,
    approvedAt: partner.approvedAt,
    commissionRate: partner.commissionRate,
    status: partner.status,
    deactivatedAt: partner.deactivatedAt,
    visits,
    referralCounts: summary.counts,
    unpaidEarningsChf: summary.unpaidChf,
    paidEarningsChf: summary.paidChf,
  };
}

function approveAffiliateApplication(application: AffiliateApplication): AffiliatePartner | null {
  if (application.status === 'approved') {
    const existing = findPartnerByEmail(application.email);
    return existing ? partnerDto(existing) : null;
  }
  affiliateApplications.update(application.id, {
    status: 'approved',
    reviewedAt: new Date().toISOString(),
  });
  let slug = slugFromEmail(application.email);
  if (isPartnerSlugTaken(slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }
  const history = createAffiliateDemoHistory(
    createAffiliatePartnerRecord({
      id: `partner-${application.id}`,
      applicationId: application.id,
      email: application.email,
      slug,
      approvedAt: new Date().toISOString(),
      commissionRate: programSettings().defaultCommissionRate,
    }),
    new Date()
  );
  const partner = affiliatePartners.create(history.partner);
  for (const row of history.links) affiliateReferralLinks.create(row);
  for (const row of history.visits) affiliateVisits.create(row);
  for (const row of history.referrals) affiliateReferrals.create(row);
  for (const row of history.payouts) affiliatePayouts.create(row);
  return partnerDto(partner);
}

function removeAffiliatePartner(partnerId: string) {
  for (const collection of [
    affiliateReferralLinks,
    affiliateVisits,
    affiliateReferrals,
    affiliatePayouts,
  ] as const) {
    for (const row of collection.all()) {
      if (row.partnerId === partnerId) collection.remove(row.id);
    }
  }
  affiliatePartners.remove(partnerId);
}

function readPayoutRequest(body: Partial<AffiliatePayoutRequest>) {
  const partner = body.partnerId ? findPartnerById(body.partnerId) : undefined;
  return {
    partner,
    period: { periodStart: body.periodStart ?? null, periodEnd: body.periodEnd ?? null },
  };
}

function payoutPreview(
  partner: AffiliatePartnerRecord,
  period: { periodStart: string | null; periodEnd: string | null }
): AffiliatePayoutPreview {
  const referrals = selectPayoutReferrals(partnerReferrals(partner.id), period);
  const amountChf = roundChf(referrals.reduce((sum, row) => sum + row.commissionChf, 0));
  const threshold = programSettings().payoutThresholdChf;
  return {
    partnerId: partner.id,
    partnerEmail: partner.email,
    notificationEmail: partner.notificationEmail,
    ...period,
    referrals: referrals
      .map(adminReferralDto)
      .filter((row): row is AffiliateAdminReferral => row !== null),
    amountChf,
    payoutThresholdChf: threshold,
    belowThreshold: amountChf < threshold,
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const billingAddress = createCollection<BillingAddress & { id: string }>(
  'account-billing-address',
  [
    {
      id: '1',
      firstName: 'Lucas',
      lastName: 'Baumgartner',
      company: 'Baumgartner Digital AG',
      department: 'Rechtsabteilung',
      line1: 'Bahnhofstrasse 12',
      line2: '',
      postalCode: '8001',
      city: 'Zürich',
      country: 'Schweiz',
      vatId: 'CHE-123.456.789 MWST',
      billingEmail: MOCK_MEMBER_EMAIL,
    },
  ],
  2
);

const LUCAS_SEED_PROFILE: Profile & { id: string } = {
  id: 'profile-lucas',
  firstName: 'Lucas',
  lastName: 'Baumgartner',
  displayName: 'Lucas Baumgartner',
  email: MOCK_MEMBER_EMAIL,
  role: 'member',
};

const ADMIN_SEED_PROFILE: Profile & { id: string } = {
  id: 'profile-admin',
  firstName: 'Martin',
  lastName: 'Steiger',
  displayName: 'Martin Steiger',
  email: MOCK_ADMIN_EMAIL,
  role: 'admin',
};

/** v3 — per-account profiles (was a single shared row that checkout could overwrite). */
const profile = createCollection<Profile & { id: string }>(
  'account-profile',
  [LUCAS_SEED_PROFILE, ADMIN_SEED_PROFILE],
  4
);

function normalizeProfileEmail(email: string): string {
  return email.trim().toLowerCase();
}

function findProfileByEmail(email: string): (Profile & { id: string }) | undefined {
  const normalized = normalizeProfileEmail(email);
  return profile.all().find((row) => normalizeProfileEmail(row.email) === normalized);
}

function profileIdForEmail(email: string): string {
  const normalized = normalizeProfileEmail(email);
  if (normalized === MOCK_MEMBER_EMAIL) return LUCAS_SEED_PROFILE.id;
  if (normalized === MOCK_ADMIN_EMAIL) return ADMIN_SEED_PROFILE.id;
  return `profile-${normalized.replace(/[^a-z0-9]+/g, '-')}`;
}

function resolveProfileForEmail(email: string): Profile & { id: string } {
  const normalized = normalizeProfileEmail(email);
  const existing = findProfileByEmail(normalized);
  if (existing) return existing;

  if (normalized === MOCK_MEMBER_EMAIL) {
    profile.create(LUCAS_SEED_PROFILE);
    return LUCAS_SEED_PROFILE;
  }

  if (normalized === MOCK_ADMIN_EMAIL) {
    profile.create(ADMIN_SEED_PROFILE);
    return ADMIN_SEED_PROFILE;
  }

  const account = findAuthAccountByEmail(normalized);
  return profile.create({
    id: profileIdForEmail(normalized),
    firstName: '',
    lastName: '',
    displayName: '',
    email: normalized,
    role: account?.role ?? accountRole(normalized) ?? 'member',
  });
}

/** Billing-system numbers. Parent subscriptions keep a stable id; each invoice gets its own. */
const EU_REP_BAUMGARTNER_SUBSCRIPTION_ID = '56218';
const EU_REP_ALPENBLICK_SUBSCRIPTION_ID = '57391';
const EU_REP_BERGHOTEL_SUBSCRIPTION_ID = '58402';
/** Agency prepaid volume (buy-more) — atypical; most members have siteCount 1. */
const POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID = '84729';
const POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID = '86104';
const POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID = '87215';
const POLICY_SINGLE_MUELLER_SUBSCRIPTION_ID = '88307';
const POLICY_EXPIRED_SUBSCRIPTION_ID = '90341';
const POLICY_TRIAL_SEEBLICK_SUBSCRIPTION_ID = '91452';
const POLICY_TRIAL_ATELIER_SUBSCRIPTION_ID = '91453';

function nextTechnicalSubscriptionId(): string {
  const used = new Set(
    [
      ...subscriptions.all().map((row) => row.id),
      ...orders.all().map((row) => row.subscriptionId),
    ].filter((id): id is string => Boolean(id))
  );
  const existing = [...used].map(Number).filter((value) => value >= 10_000 && value <= 99_999);
  let next = existing.length > 0 ? Math.max(...existing) + 17 : 10_000 + (used.size + 1) * 1733;
  if (next > 99_999) next = 10_000;
  while (used.has(String(next)) || next < 10_000) {
    next = next >= 99_999 ? 10_000 : next + 1;
  }
  return String(next);
}

const subscriptions = createCollection<Subscription>(
  'billing-subscriptions',
  [
    {
      id: EU_REP_BAUMGARTNER_SUBSCRIPTION_ID,
      productType: 'euRep',
      product: 'EU Representation — Plus',
      planId: 'plus',
      legalEntityCount: 1,
      includedRequests: 1,
      usedRequests: 1,
      requestUsages: [{ date: '2026-06-18T10:45:00' }],
      status: 'active',
      startDate: '2026-04-02',
      lastOrderDate: '2026-04-02',
      nextPaymentDate: '2027-04-02',
      billingAddressId: '1',
      totals: {
        product: 'EU Representation — Plus (12 Monate)',
        subtotal: 229,
        discount: 0,
        total: 229,
        currency: 'CHF',
      },
      relatedOrderIds: ['3'],
    },
    {
      id: EU_REP_ALPENBLICK_SUBSCRIPTION_ID,
      productType: 'euRep',
      product: 'EU Representation — Plus 5',
      planId: 'plus5',
      legalEntityCount: 1,
      includedRequests: 5,
      usedRequests: 2,
      requestUsages: [{ date: '2026-07-11T09:15:00' }, { date: '2026-05-22T14:30:00' }],
      status: 'active',
      startDate: '2026-05-18',
      lastOrderDate: '2026-05-18',
      nextPaymentDate: '2027-05-18',
      billingAddressId: '1',
      totals: {
        product: 'EU Representation — Plus 5 (12 Monate)',
        subtotal: 499,
        discount: 0,
        total: 499,
        currency: 'CHF',
      },
      relatedOrderIds: ['21'],
    },
    {
      id: EU_REP_BERGHOTEL_SUBSCRIPTION_ID,
      productType: 'euRep',
      product: 'EU Representation — Basis',
      planId: 'basis',
      legalEntityCount: 1,
      includedRequests: 0,
      usedRequests: 0,
      status: 'expired',
      startDate: '2025-06-01',
      lastOrderDate: '2025-06-01',
      nextPaymentDate: null,
      billingAddressId: '1',
      totals: {
        product: 'EU Representation — Basis (12 Monate)',
        subtotal: 149,
        discount: 0,
        total: 149,
        currency: 'CHF',
      },
      relatedOrderIds: ['23'],
    },
    {
      id: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy Generator — 5 Sites (prepaid)',
      planId: '5',
      siteCount: 5,
      status: 'active',
      startDate: '2026-01-15',
      lastOrderDate: '2026-01-15',
      nextPaymentDate: '2027-01-15',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy Generator — 5 Sites (12 Monate)',
        subtotal: 445,
        discount: 33.38,
        total: 411.62,
        currency: 'CHF',
      },
      relatedOrderIds: ['2'],
    },
    {
      id: POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy — alpenblick-hotel.ch',
      planId: '1',
      siteCount: 1,
      status: 'active',
      startDate: '2025-09-16',
      lastOrderDate: '2025-09-16',
      nextPaymentDate: '2026-09-16',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy — alpenblick-hotel.ch (12 Monate)',
        subtotal: 89,
        discount: 0,
        total: 89,
        currency: 'CHF',
      },
      relatedOrderIds: ['20'],
    },
    {
      id: POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy — sutter-web.ch',
      planId: '1',
      siteCount: 1,
      status: 'active',
      startDate: '2026-02-08',
      lastOrderDate: '2026-02-08',
      nextPaymentDate: '2027-02-08',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy — sutter-web.ch (12 Monate)',
        subtotal: 89,
        discount: 0,
        total: 89,
        currency: 'CHF',
      },
      relatedOrderIds: ['22'],
    },
    {
      id: POLICY_SINGLE_MUELLER_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy — mueller-consulting.ch',
      planId: '1',
      siteCount: 1,
      status: 'active',
      startDate: '2026-01-22',
      lastOrderDate: '2026-01-22',
      nextPaymentDate: '2027-01-22',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy — mueller-consulting.ch (12 Monate)',
        subtotal: 89,
        discount: 0,
        total: 89,
        currency: 'CHF',
      },
      relatedOrderIds: ['24'],
    },
    {
      id: POLICY_EXPIRED_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy Generator — 1 Site',
      planId: '1',
      siteCount: 1,
      status: 'expired',
      startDate: '2025-07-01',
      lastOrderDate: '2025-07-01',
      nextPaymentDate: null,
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy Generator — 1 Site (12 Monate)',
        subtotal: 89,
        discount: 0,
        total: 89,
        currency: 'CHF',
      },
      relatedOrderIds: ['19'],
    },
    {
      id: POLICY_TRIAL_SEEBLICK_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy — seeblick-apotheke.ch',
      planId: '1',
      siteCount: 1,
      status: 'active',
      startDate: '2026-08-17',
      lastOrderDate: '2026-08-17',
      nextPaymentDate: '2026-09-14',
      trialEndsAt: '2026-09-14',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy — seeblick-apotheke.ch (12 Monate)',
        subtotal: 0,
        discount: 0,
        total: 0,
        currency: 'CHF',
      },
      relatedOrderIds: [],
    },
    {
      id: POLICY_TRIAL_ATELIER_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy — atelier-bern.ch',
      planId: '1',
      siteCount: 1,
      status: 'active',
      startDate: '2026-08-24',
      lastOrderDate: '2026-08-24',
      nextPaymentDate: '2026-09-14',
      trialEndsAt: '2026-09-14',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy — atelier-bern.ch (12 Monate)',
        subtotal: 0,
        discount: 0,
        total: 0,
        currency: 'CHF',
      },
      relatedOrderIds: [],
    },
  ],
  22
);

type CheckoutSessionRecord = {
  id: string;
  status: 'pending' | 'completed';
  kind: CheckoutSessionCreate['kind'];
  siteCount: number;
  amount: number;
  generatorAmount: number;
  listPrice: number;
  discountRate: number;
  discountAmount: number;
  currency: 'CHF';
  domain?: string;
  policyName?: string;
  legalEntity?: string;
  euRepPlanId?: EuRepPlanId;
  euRepEntityCount?: number;
  euRepEntities?: CheckoutSessionCreate['euRepEntities'];
  euRepLinkContractId?: string;
  subscriptionId?: string;
  fillSubscriptionId?: string;
  useAvailableSlot?: boolean;
  orderId?: string;
  documentId?: string;
  euRepContractId?: string;
  euRepContractIds?: string[];
  promoCode?: string;
  returnUrl?: string;
};

const checkoutSessions = createCollection<CheckoutSessionRecord>('checkout-sessions', [], 4);

type PendingRegistration = RegisterInput & {
  id: string;
  verificationToken: string;
};

type PendingCheckoutRecord = {
  id: string;
  domain: string;
  legalEntity?: string;
  fillSubscriptionId?: string;
  documentId?: string;
  subscriptionId?: string;
  trialEndsAt?: string;
  euRepPlanId?: EuRepPlanId;
  euRepEntityCount?: number;
  euRepEntities?: CheckoutSessionCreate['euRepEntities'];
  euRepLinkContractId?: string;
};

const pendingRegistrations = createCollection<PendingRegistration>('pending-registrations', [], 4);
const pendingCheckouts = createCollection<PendingCheckoutRecord>('pending-checkouts', [], 4);

function addOneYear(isoDate: string): string {
  const date = new Date(isoDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function shouldStartNewTermOnContinue(subscription: Subscription): boolean {
  const today = new Date().toISOString().slice(0, 10);

  if (subscription.status === 'expired') return true;
  if (!subscription.nextPaymentDate) return true;

  const termEnd = addDays(subscription.nextPaymentDate, -1);
  if (subscription.status === 'cancelled') {
    return termEnd < today;
  }

  if (subscription.status === 'active' && subscription.nextPaymentDate < today) {
    return true;
  }

  return false;
}

function createRenewalOrderForSubscription(subscription: Subscription, today: string): Order {
  if (subscription.productType === 'policy') {
    const activeSiteCount = countActivePolicySites(subscriptions.all());
    const siteCount = resolvePolicySiteCount(subscription);
    const quote = calculateGeneratorPolicyQuote(activeSiteCount, siteCount);

    return orders.create({
      productType: 'policy',
      number: nextOrderNumber(),
      date: today,
      status: 'active',
      total: quote.amountDue,
      currency: 'CHF',
      siteCount,
      discountAmount: quote.discountAmount > 0 ? quote.discountAmount : undefined,
      discountRate: quote.discountRate > 0 ? quote.discountRate : undefined,
      subscriptionId: subscription.id,
      orderKind: 'renewal',
    });
  }

  const planId = (subscription.planId ?? 'basis') as EuRepPlanId;
  const quote = calculateEuRepQuote(planId);

  return orders.create({
    productType: 'euRep',
    number: nextOrderNumber(),
    date: today,
    status: 'active',
    total: quote.amountDue,
    currency: 'CHF',
    legalEntityCount: subscription.legalEntityCount ?? 1,
    planId,
    orderKind: 'renewal',
    subscriptionId: subscription.id,
  });
}

function subscriptionRenewalQuote(subscription: Subscription) {
  return calculateSubscriptionRenewalQuote(
    subscription,
    countActivePolicySites(subscriptions.all())
  );
}

/** Reactivate with a fresh 12-month term starting today, billed as a renewal order. */
function startNewSubscriptionTerm(existing: Subscription, today: string) {
  const quote = subscriptionRenewalQuote(existing);
  const order = createRenewalOrderForSubscription(existing, today);
  const subscription = subscriptions.update(existing.id, {
    status: 'active',
    startDate: today,
    lastOrderDate: today,
    nextPaymentDate: addDays(today, 365),
    relatedOrderIds: [...existing.relatedOrderIds, order.id],
    totals: {
      ...existing.totals,
      subtotal: quote.listPrice,
      discount: quote.discountAmount,
      total: quote.amountDue,
    },
  });
  return { subscription, order };
}

function nextOrderNumber(): string {
  const year = new Date().getFullYear();
  const seq = orders.all().length + 1200;
  return `DSP-${year}-${seq}`;
}

function policyProductLabel(siteCount: number, domain?: string): string {
  if (domain) {
    return `Privacy Policy — ${domain.replace(/^www\./, '')}`;
  }
  return `Privacy Policy Generator — ${siteCount} ${siteCount === 1 ? 'Site' : 'Sites'}`;
}

function checkoutSessionOrderContext(
  session: CheckoutSessionRecord,
  subscription?: Subscription
): {
  domain?: string;
  legalEntity?: string;
  euRepPlanId?: string;
  euRepPlanLabel?: string;
  policyAmountExclVat?: number;
  euRepAmountExclVat?: number;
  siteCount?: number;
} {
  const euRepAmount = Math.max(0, session.amount - session.generatorAmount);
  const policyAmount = session.generatorAmount;

  if (session.kind === 'subscriptionRenewal' && subscription) {
    if (subscription.productType === 'policy') {
      const domain = documents.all().find((row) => row.subscriptionId === subscription.id)?.site;
      return {
        domain,
        policyAmountExclVat: session.amount,
        euRepAmountExclVat: 0,
        siteCount: session.siteCount,
      };
    }
    const contract = euRepContracts.all().find((row) => row.subscriptionId === subscription.id);
    const planId = (subscription.planId ?? 'basis') as EuRepPlanId;
    return {
      legalEntity: contract?.legalEntity,
      euRepPlanId: planId,
      euRepPlanLabel: euRepProductLabel(planId),
      policyAmountExclVat: 0,
      euRepAmountExclVat: session.amount,
      siteCount: 1,
    };
  }

  const planId = session.euRepPlanId;
  return {
    domain: session.domain,
    legalEntity: session.legalEntity ?? session.euRepEntities?.[0]?.legalEntity,
    euRepPlanId: planId,
    euRepPlanLabel: planId ? euRepProductLabel(planId) : undefined,
    policyAmountExclVat: policyAmount,
    euRepAmountExclVat: euRepAmount,
    siteCount: session.siteCount,
  };
}

function euRepProductLabel(planId: string): string {
  const plan = resolveEuRepPlan(planId);
  const titles: Record<string, string> = {
    basis: 'EU Representation — Basis',
    plus: 'EU Representation — Plus',
    plus5: 'EU Representation — Plus 5',
  };
  return titles[plan.id] ?? `EU Representation — ${plan.id}`;
}

function defaultPostalForEntity(legalEntity: string) {
  return {
    postalLine1: 'Bahnhofstrasse 1',
    postalCode: '8001',
    city: 'Zürich',
    country: 'Schweiz',
    legalEntity,
  };
}

/**
 * One EU Rep plan subscription covering `entityCount` legal entities.
 * Wizard always uses Basis; standalone passes `euRepPlanId`.
 */
function createEuRepPurchase(
  session: CheckoutSessionRecord,
  today: string,
  options?: { trialEndsAt?: string }
):
  | { orderId: string; subscriptionId: string; contractId?: string; contractIds: string[] }
  | undefined {
  const entityCount = Math.max(1, session.euRepEntityCount ?? session.euRepEntities?.length ?? 0);
  if (!session.euRepEntityCount && !session.euRepEntities?.length) return undefined;

  const planId = session.euRepPlanId ?? 'basis';
  const quote = calculateEuRepQuote(planId, entityCount);
  const plan = resolveEuRepPlan(planId);
  const nextPaymentDate = addOneYear(today);
  const entities = session.euRepEntities ?? [];
  const product = euRepProductLabel(planId);
  const subscriptionId = nextTechnicalSubscriptionId();
  const isTrial = Boolean(options?.trialEndsAt);

  const euOrder = isTrial
    ? undefined
    : orders.create({
        productType: 'euRep',
        number: nextOrderNumber(),
        date: today,
        status: 'active',
        total: quote.amountDue,
        currency: 'CHF',
        legalEntityCount: entityCount,
        planId: plan.id,
        orderKind: 'subscription',
        subscriptionId,
      });

  subscriptions.create({
    id: subscriptionId,
    productType: 'euRep',
    product,
    planId: plan.id,
    legalEntityCount: entityCount,
    includedRequests: plan.includedRequests,
    usedRequests: 0,
    status: 'active',
    startDate: today,
    lastOrderDate: isTrial ? null : today,
    nextPaymentDate: isTrial ? null : nextPaymentDate,
    trialEndsAt: options?.trialEndsAt,
    billingAddressId: '1',
    totals: {
      product: `${product} (12 Monate)`,
      subtotal: quote.amountDue,
      discount: 0,
      total: quote.amountDue,
      currency: 'CHF',
    },
    relatedOrderIds: euOrder ? [euOrder.id] : [],
  });

  const contractIds: string[] = [];
  let firstContractId: string | undefined;

  for (let index = 0; index < entityCount; index += 1) {
    const details = entities[index];
    const legalEntity = details?.legalEntity.trim() || `Legal entity ${String(index + 1)}`;
    const defaults = defaultPostalForEntity(legalEntity);
    const created = euRepContracts.create({
      subscriptionId,
      legalEntity,
      forwardingEmail: details?.forwardingEmail.trim() || MOCK_MEMBER_EMAIL,
      postalLine1: details?.postalLine1.trim() || defaults.postalLine1,
      postalDepartment: details?.postalDepartment.trim() || undefined,
      postalLine2: details?.postalLine2.trim() || undefined,
      postalCode: details?.postalCode.trim() || defaults.postalCode,
      city: details?.city.trim() || defaults.city,
      country: details?.country.trim() || defaults.country,
      linkedDocumentIds: [],
      status: 'active',
    });
    contractIds.push(created.id);
    firstContractId ??= created.id;
  }

  return {
    orderId: euOrder?.id ?? '',
    subscriptionId,
    contractId: firstContractId,
    contractIds,
  };
}

function completeCheckoutSession(sessionId: string): CheckoutSessionRecord | undefined {
  const session = checkoutSessions.all().find((row) => row.id === sessionId);
  if (!session || session.status === 'completed') {
    return undefined;
  }

  const today = new Date().toISOString().slice(0, 10);

  if (session.kind === 'subscriptionRenewal') {
    const existing = subscriptions.all().find((row) => row.id === session.subscriptionId);
    if (!existing) return undefined;
    const { order } = startNewSubscriptionTerm(existing, today);
    return checkoutSessions.update(sessionId, { status: 'completed', orderId: order.id });
  }

  if (session.kind === 'euRep') {
    const euResult = createEuRepPurchase(session, today);
    if (!euResult) return undefined;
    return checkoutSessions.update(sessionId, {
      status: 'completed',
      orderId: euResult.orderId,
      subscriptionId: euResult.subscriptionId,
      euRepContractId: euResult.contractId,
      euRepContractIds: euResult.contractIds,
    });
  }

  const nextPaymentDate = addOneYear(today);
  const isRenewal = session.kind === 'generatorRenewal';
  const siteCount = Math.max(1, session.siteCount);

  if (session.fillSubscriptionId && session.domain) {
    const slotSubscription = subscriptions
      .all()
      .find((row) => row.id === session.fillSubscriptionId);
    if (
      !slotSubscription ||
      slotSubscription.productType !== 'policy' ||
      slotSubscription.status !== 'active' ||
      countAvailablePolicySlots(slotSubscription, documents.all()) <= 0
    ) {
      return undefined;
    }

    const willBuyEuRep = Boolean(session.euRepEntityCount || session.euRepEntities?.length);
    const willLinkExisting = Boolean(session.euRepLinkContractId);
    const linkedContract = willLinkExisting
      ? euRepContracts.all().find((row) => row.id === session.euRepLinkContractId)
      : undefined;
    const swissLegalEntity =
      session.legalEntity?.trim() ||
      session.euRepEntities?.[0]?.legalEntity.trim() ||
      linkedContract?.legalEntity ||
      undefined;

    const created = documents.create({
      name: session.policyName ?? 'Privacy Policy',
      site: session.domain.replace(/^www\./, ''),
      legalEntity: swissLegalEntity,
      subscriptionId: slotSubscription.id,
      createdDate: today,
      updatedDate: today,
      versions: buildPolicyVersions(today),
    });

    let euRepOrderId = '';
    if (willBuyEuRep) {
      const euResult = createEuRepPurchase(session, today);
      euRepOrderId = euResult?.orderId ?? '';
    }

    return checkoutSessions.update(sessionId, {
      status: 'completed',
      orderId: euRepOrderId,
      documentId: created.id,
      subscriptionId: slotSubscription.id,
    });
  }

  const productLabel = session.domain
    ? policyProductLabel(1, session.domain)
    : policyProductLabel(siteCount);

  let policySubscriptionId = isRenewal ? session.subscriptionId : undefined;
  if (isRenewal && policySubscriptionId) {
    const existing = subscriptions.all().find((row) => row.id === policySubscriptionId);
    if (!existing || existing.productType !== 'policy') {
      policySubscriptionId = undefined;
    }
  }

  const subscriptionSiteCount =
    session.domain && !session.fillSubscriptionId && !isRenewal ? 1 : siteCount;

  if (!policySubscriptionId) {
    const createdSub = subscriptions.create({
      id: nextTechnicalSubscriptionId(),
      productType: 'policy',
      product: session.domain ? productLabel : policyProductLabel(subscriptionSiteCount),
      planId: String(subscriptionSiteCount),
      siteCount: subscriptionSiteCount,
      status: 'active',
      startDate: today,
      lastOrderDate: today,
      nextPaymentDate,
      billingAddressId: '1',
      totals: {
        product: `${productLabel} (12 Monate)`,
        subtotal: session.listPrice,
        discount: session.discountAmount,
        total: session.generatorAmount,
        currency: 'CHF',
      },
      relatedOrderIds: [],
    });
    policySubscriptionId = createdSub.id;
  }

  const policyOrder = orders.create({
    productType: 'policy',
    number: nextOrderNumber(),
    date: today,
    status: 'active',
    total: session.generatorAmount,
    currency: session.currency,
    siteCount: subscriptionSiteCount,
    discountAmount: session.discountAmount > 0 ? session.discountAmount : undefined,
    discountRate: session.discountRate > 0 ? session.discountRate : undefined,
    subscriptionId: policySubscriptionId,
    orderKind: isRenewal ? 'renewal' : 'subscription',
  });

  const policySub = subscriptions.all().find((row) => row.id === policySubscriptionId);
  if (policySub) {
    subscriptions.update(policySub.id, {
      lastOrderDate: today,
      nextPaymentDate,
      status: 'active',
      siteCount: isRenewal ? (policySub.siteCount ?? subscriptionSiteCount) : subscriptionSiteCount,
      planId: String(
        isRenewal ? (policySub.siteCount ?? subscriptionSiteCount) : subscriptionSiteCount
      ),
      product: session.domain ? productLabel : policyProductLabel(subscriptionSiteCount),
      totals: {
        ...policySub.totals,
        product: `${session.domain ? productLabel : policySub.product} (12 Monate)`,
        subtotal: session.listPrice,
        discount: session.discountAmount,
        total: session.generatorAmount,
      },
      relatedOrderIds: [...policySub.relatedOrderIds, policyOrder.id],
    });
  }

  const willBuyEuRep = Boolean(session.euRepEntityCount || session.euRepEntities?.length);
  const willLinkExisting = Boolean(session.euRepLinkContractId);
  const linkedContract = willLinkExisting
    ? euRepContracts.all().find((row) => row.id === session.euRepLinkContractId)
    : undefined;
  const swissLegalEntity =
    session.legalEntity?.trim() ||
    session.euRepEntities?.[0]?.legalEntity.trim() ||
    linkedContract?.legalEntity ||
    undefined;

  let documentId: string | undefined;
  if (session.domain) {
    const created = documents.create({
      name: session.policyName ?? 'Privacy Policy',
      site: session.domain.replace(/^www\./, ''),
      legalEntity: swissLegalEntity,
      subscriptionId: policySubscriptionId,
      createdDate: today,
      updatedDate: today,
      versions: buildPolicyVersions(today),
    });
    documentId = created.id;
  }

  if (willBuyEuRep) {
    createEuRepPurchase(session, today);
  }

  const completed = checkoutSessions.update(sessionId, {
    status: 'completed',
    orderId: policyOrder.id,
    documentId,
    subscriptionId: policySubscriptionId,
  });

  return completed;
}

function startPolicyTrial(input: CheckoutSessionCreate):
  | {
      document?: GeneratedDocument;
      subscriptionId?: string;
      trialEndsAt?: string;
      documentId?: string;
    }
  | undefined {
  const today = new Date().toISOString().slice(0, 10);
  const domain = input.domain?.replace(/^www\./, '');
  if (!domain) return undefined;

  const willBuyEuRep = Boolean(input.euRepEntityCount || input.euRepEntities?.length);
  const willLinkExisting = Boolean(input.euRepLinkContractId);
  const linkedContract = willLinkExisting
    ? euRepContracts.all().find((row) => row.id === input.euRepLinkContractId)
    : undefined;
  const swissLegalEntity =
    input.legalEntity?.trim() ||
    input.euRepEntities?.[0]?.legalEntity.trim() ||
    linkedContract?.legalEntity ||
    undefined;

  if (input.fillSubscriptionId) {
    const slotSubscription = subscriptions.all().find((row) => row.id === input.fillSubscriptionId);
    if (
      !slotSubscription ||
      slotSubscription.productType !== 'policy' ||
      slotSubscription.status !== 'active' ||
      countAvailablePolicySlots(slotSubscription, documents.all()) <= 0
    ) {
      return undefined;
    }

    const created = documents.create({
      name: input.policyName ?? 'Privacy Policy',
      site: domain,
      legalEntity: swissLegalEntity,
      subscriptionId: slotSubscription.id,
      createdDate: today,
      updatedDate: today,
      versions: buildPolicyVersions(today),
    });

    // Fill-slot: the policy is already paid, so EU Rep is billed at checkout — no trial.
    if (willBuyEuRep) {
      const existing = pendingCheckouts
        .all()
        .find((row) => formatSiteDomain(row.domain) === formatSiteDomain(domain));
      const record = {
        domain,
        legalEntity: swissLegalEntity,
        fillSubscriptionId: input.fillSubscriptionId,
        documentId: created.id,
        subscriptionId: slotSubscription.id,
        euRepPlanId: input.euRepPlanId ?? 'basis',
        euRepEntityCount: input.euRepEntityCount,
        euRepEntities: input.euRepEntities,
        euRepLinkContractId: input.euRepLinkContractId,
      };
      if (existing) pendingCheckouts.update(existing.id, record);
      else pendingCheckouts.create(record);
    }

    return {
      document: created,
      documentId: created.id,
      subscriptionId: slotSubscription.id,
    };
  }

  const trialEndsAt = addDays(today, POLICY_TRIAL_DAYS);
  const productLabel = policyProductLabel(1, domain);
  const createdSub = subscriptions.create({
    id: nextTechnicalSubscriptionId(),
    productType: 'policy',
    product: productLabel,
    planId: '1',
    siteCount: 1,
    status: 'active',
    startDate: today,
    lastOrderDate: today,
    nextPaymentDate: trialEndsAt,
    trialEndsAt,
    billingAddressId: '1',
    totals: {
      product: `${productLabel} (12 Monate)`,
      subtotal: 0,
      discount: 0,
      total: 0,
      currency: 'CHF',
    },
    relatedOrderIds: [],
  });

  const created = documents.create({
    name: input.policyName ?? 'Privacy Policy',
    site: domain,
    legalEntity: swissLegalEntity,
    subscriptionId: createdSub.id,
    createdDate: today,
    updatedDate: today,
    versions: buildPolicyVersions(today),
  });

  if (willBuyEuRep) {
    createEuRepPurchase(
      {
        id: 'trial-eu-rep',
        status: 'pending',
        kind: 'euRep',
        siteCount: 1,
        amount: 0,
        generatorAmount: 0,
        listPrice: 0,
        discountRate: 0,
        discountAmount: 0,
        currency: 'CHF',
        euRepPlanId: input.euRepPlanId ?? 'basis',
        euRepEntityCount: input.euRepEntityCount ?? 1,
        euRepEntities: input.euRepEntities,
      },
      today,
      { trialEndsAt }
    );
  }

  const existingPending = pendingCheckouts
    .all()
    .find((row) => formatSiteDomain(row.domain) === formatSiteDomain(domain));
  const pendingRecord = {
    domain,
    legalEntity: swissLegalEntity,
    documentId: created.id,
    subscriptionId: createdSub.id,
    trialEndsAt,
    euRepPlanId: willBuyEuRep ? (input.euRepPlanId ?? 'basis') : undefined,
    euRepEntityCount: input.euRepEntityCount,
    euRepEntities: input.euRepEntities,
    euRepLinkContractId: input.euRepLinkContractId,
  };
  if (existingPending) pendingCheckouts.update(existingPending.id, pendingRecord);
  else pendingCheckouts.create(pendingRecord);

  return {
    document: created,
    documentId: created.id,
    subscriptionId: createdSub.id,
    trialEndsAt,
  };
}

const orders = createCollection<Order>(
  'billing-orders',
  [
    {
      id: '2',
      productType: 'policy',
      number: 'DSP-2026-1005',
      date: '2026-01-15',
      status: 'active',
      total: 411.62,
      currency: 'CHF',
      siteCount: 5,
      discountAmount: 33.38,
      discountRate: 0.075,
      orderKind: 'subscription',
      subscriptionId: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
    },
    {
      id: '24',
      productType: 'policy',
      number: 'DSP-2026-1042',
      date: '2026-01-22',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
      orderKind: 'subscription',
      subscriptionId: POLICY_SINGLE_MUELLER_SUBSCRIPTION_ID,
    },
    {
      id: '20',
      productType: 'policy',
      number: 'DSP-2025-1024',
      date: '2025-09-16',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
      orderKind: 'subscription',
      subscriptionId: POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID,
    },
    {
      id: '22',
      productType: 'policy',
      number: 'DSP-2026-1031',
      date: '2026-02-08',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
      orderKind: 'subscription',
      subscriptionId: POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID,
    },
    {
      id: '3',
      productType: 'euRep',
      number: 'DSP-2026-1077',
      date: '2026-04-02',
      status: 'active',
      total: 229,
      currency: 'CHF',
      legalEntityCount: 1,
      planId: 'plus',
      orderKind: 'subscription',
      subscriptionId: EU_REP_BAUMGARTNER_SUBSCRIPTION_ID,
    },
    {
      id: '21',
      productType: 'euRep',
      number: 'DSP-2026-1082',
      date: '2026-05-18',
      status: 'active',
      total: 499,
      currency: 'CHF',
      legalEntityCount: 1,
      planId: 'plus5',
      orderKind: 'subscription',
      subscriptionId: EU_REP_ALPENBLICK_SUBSCRIPTION_ID,
    },
    {
      id: '23',
      productType: 'euRep',
      number: 'DSP-2026-1091',
      date: '2026-06-01',
      status: 'active',
      total: 149,
      currency: 'CHF',
      legalEntityCount: 1,
      planId: 'basis',
      orderKind: 'subscription',
      subscriptionId: EU_REP_BERGHOTEL_SUBSCRIPTION_ID,
    },
    {
      id: '19',
      productType: 'policy',
      number: 'DSP-2025-1102',
      date: '2025-07-01',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
      orderKind: 'subscription',
      subscriptionId: POLICY_EXPIRED_SUBSCRIPTION_ID,
    },
  ],
  18
);

/** Latest legal year the hosted policies have been maintained through. */
const CURRENT_POLICY_YEAR = 2026;

/**
 * Derive the yearly revision history for a hosted policy. One revision per year
 * from the year it was first generated up to the current maintained year; the
 * newest is the live (`current`) revision.
 */
function buildPolicyVersions(createdDate: string): PolicyVersion[] {
  const createdYear = Number(createdDate.slice(0, 4));
  const versions: PolicyVersion[] = [];
  for (let year = CURRENT_POLICY_YEAR; year >= createdYear; year -= 1) {
    versions.push({
      year,
      current: year === CURRENT_POLICY_YEAR,
      effectiveDate: year === createdYear ? createdDate : `${year}-01-15`,
      changeSummary: year === createdYear ? 'initial' : 'annualReview',
    });
  }
  return versions;
}

const documents = createCollection<GeneratedDocument>(
  'generated-documents',
  (
    [
      {
        id: '1',
        name: 'Datenschutzerklärung',
        site: 'sutter-web.ch',
        legalEntity: 'Baumgartner Digital AG',
        subscriptionId: POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID,
        createdDate: '2026-02-10',
        updatedDate: '2026-06-15',
      },
      {
        id: '3',
        name: 'Privacy Policy',
        site: 'alpenblick-hotel.ch',
        legalEntity: 'Alpenblick Hospitality AG',
        subscriptionId: POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID,
        createdDate: '2025-09-20',
        updatedDate: '2026-05-20',
      },
      {
        id: '6',
        name: 'Privacy Policy',
        site: 'mueller-consulting.ch',
        legalEntity: 'Müller Consulting GmbH',
        subscriptionId: POLICY_SINGLE_MUELLER_SUBSCRIPTION_ID,
        createdDate: '2026-01-22',
        updatedDate: '2026-04-02',
      },
      {
        id: '7',
        name: 'Datenschutzerklärung',
        site: 'seeblick-apotheke.ch',
        legalEntity: 'Seeblick Apotheke AG',
        subscriptionId: POLICY_TRIAL_SEEBLICK_SUBSCRIPTION_ID,
        createdDate: '2026-02-05',
        updatedDate: '2026-02-05',
      },
      {
        id: '8',
        name: 'Privacy Policy',
        site: 'atelier-bern.ch',
        legalEntity: 'Atelier Bern GmbH',
        subscriptionId: POLICY_TRIAL_ATELIER_SUBSCRIPTION_ID,
        createdDate: '2026-03-02',
        updatedDate: '2026-03-02',
      },
      {
        id: '4',
        name: 'Privacy Policy',
        site: 'kreativ-studio.ch',
        legalEntity: 'Kreativ Studio GmbH',
        subscriptionId: POLICY_EXPIRED_SUBSCRIPTION_ID,
        createdDate: '2025-07-08',
        updatedDate: '2026-06-01',
      },
    ] satisfies GeneratedDocument[]
  ).map((doc) => ({ ...doc, versions: buildPolicyVersions(doc.createdDate) })),
  22
);

function findDocumentBySite(site: string): GeneratedDocument | undefined {
  const normalized = formatSiteDomain(site);
  return documents.all().find((doc) => formatSiteDomain(resolveDocumentSite(doc)) === normalized);
}

/** Seeded documents belong to the prototype member account — other users may reuse the same domain. */
function findDocumentBySiteForAccount(
  email: string | null,
  site: string
): GeneratedDocument | undefined {
  if (!email || email.trim().toLowerCase() !== MOCK_MEMBER_EMAIL) {
    return undefined;
  }
  return findDocumentBySite(site);
}

function findActiveEuRepContractForLegalEntity(legalEntity: string) {
  const needle = legalEntity.trim().toLowerCase();
  if (!needle) return undefined;
  return euRepContracts.all().find((row) => {
    if (row.status !== 'active') return false;
    if (row.legalEntity.trim().toLowerCase() !== needle) return false;
    const subscription = subscriptions.all().find((item) => item.id === row.subscriptionId);
    return subscriptionGrantsProductAccess(subscription);
  });
}

function inferBundledEuRepForTrialDocument(
  doc: GeneratedDocument,
  pending?: PendingCheckoutRecord
): Pick<
  PendingCheckoutRecord,
  'euRepPlanId' | 'euRepEntityCount' | 'euRepEntities' | 'euRepLinkContractId'
> {
  if (pending?.euRepEntityCount || pending?.euRepEntities?.length) {
    return {
      euRepPlanId: pending.euRepPlanId,
      euRepEntityCount: pending.euRepEntityCount,
      euRepEntities: pending.euRepEntities,
      euRepLinkContractId: pending.euRepLinkContractId,
    };
  }

  if (pending?.euRepLinkContractId) {
    return { euRepLinkContractId: pending.euRepLinkContractId };
  }

  const entity = doc.legalEntity?.trim().toLowerCase();
  if (!entity) return {};

  const contract = euRepContracts
    .all()
    .find((row) => row.status === 'active' && row.legalEntity.trim().toLowerCase() === entity);
  if (!contract) return {};

  const euSub = subscriptions.all().find((row) => row.id === contract.subscriptionId);
  if (!euSub || !isEuRepSubscriptionOnTrial(euSub)) return {};

  const planId = (euSub.planId as EuRepPlanId | undefined) ?? 'basis';

  return {
    euRepPlanId: planId,
    euRepEntityCount: euSub.legalEntityCount ?? 1,
    euRepEntities: [
      {
        legalEntity: contract.legalEntity,
        forwardingEmail: contract.forwardingEmail,
        postalDepartment: contract.postalDepartment ?? '',
        postalLine1: contract.postalLine1,
        postalLine2: contract.postalLine2 ?? '',
        postalCode: contract.postalCode,
        city: contract.city,
        country: contract.country,
      },
    ],
  };
}

function resolvePendingCheckoutForSite(site: string) {
  const doc = findDocumentBySite(site);
  if (!doc?.subscriptionId) {
    return { needed: false as const };
  }

  const subscription = subscriptions.all().find((row) => row.id === doc.subscriptionId);
  if (!subscription || !isPolicySubscriptionOnTrial(subscription)) {
    return { needed: false as const };
  }

  const normalized = formatSiteDomain(site);
  const pending = pendingCheckouts.all().find((row) => formatSiteDomain(row.domain) === normalized);
  const bundledEuRep = inferBundledEuRepForTrialDocument(doc, pending);

  return {
    needed: true as const,
    trialEndsAt: subscription.trialEndsAt,
    domain: resolveDocumentSite(doc),
    legalEntity: doc.legalEntity ?? pending?.legalEntity,
    fillSubscriptionId: pending?.fillSubscriptionId,
    documentId: doc.id,
    subscriptionId: doc.subscriptionId,
    euRepPlanId: bundledEuRep.euRepPlanId,
    euRepEntityCount: bundledEuRep.euRepEntityCount,
    euRepEntities: bundledEuRep.euRepEntities,
    euRepLinkContractId: bundledEuRep.euRepLinkContractId,
  };
}

function findPendingCheckoutRecord(site?: string | null): PendingCheckoutRecord | undefined {
  if (site) {
    const normalized = formatSiteDomain(site);
    const fromCollection = pendingCheckouts
      .all()
      .find((row) => formatSiteDomain(row.domain) === normalized);
    if (fromCollection) return fromCollection;

    const resolved = resolvePendingCheckoutForSite(site);
    if (!resolved.needed) return undefined;

    return {
      id: '__synthetic__',
      domain: resolved.domain,
      legalEntity: resolved.legalEntity,
      documentId: resolved.documentId,
      subscriptionId: resolved.subscriptionId,
      trialEndsAt: resolved.trialEndsAt,
      fillSubscriptionId: resolved.fillSubscriptionId,
      euRepPlanId: resolved.euRepPlanId,
      euRepEntityCount: resolved.euRepEntityCount,
      euRepEntities: resolved.euRepEntities,
      euRepLinkContractId: resolved.euRepLinkContractId,
    };
  }

  return pendingCheckouts.all()[0];
}

const euRepContracts = createCollection<EuRepContract>(
  'eu-rep-contracts',
  [
    {
      id: '1',
      subscriptionId: EU_REP_BAUMGARTNER_SUBSCRIPTION_ID,
      legalEntity: 'Baumgartner Digital AG',
      forwardingEmail: MOCK_MEMBER_EMAIL,
      postalDepartment: 'Rechtsabteilung',
      postalLine1: 'Bahnhofstrasse 12',
      postalCode: '8001',
      city: 'Zürich',
      country: 'Schweiz',
      linkedDocumentIds: [],
      status: 'active',
    },
    {
      id: '2',
      subscriptionId: EU_REP_ALPENBLICK_SUBSCRIPTION_ID,
      legalEntity: 'Alpenblick Hospitality AG',
      forwardingEmail: 'privacy@alpenblick-hotel.ch',
      postalLine1: 'Seestrasse 8',
      postalCode: '3800',
      city: 'Interlaken',
      country: 'Schweiz',
      linkedDocumentIds: [],
      status: 'active',
    },
    {
      id: '3',
      subscriptionId: EU_REP_BERGHOTEL_SUBSCRIPTION_ID,
      legalEntity: 'Berghotel Grindelwald AG',
      website: 'berghotel-grindelwald.ch',
      forwardingEmail: 'privacy@berghotel-grindelwald.ch',
      postalLine1: 'Dorfstrasse 18',
      postalCode: '3818',
      city: 'Grindelwald',
      country: 'Schweiz',
      linkedDocumentIds: [],
      status: 'active',
    },
  ],
  8
);

const SWISS_LEGAL_ENTITY_BY_SITE: Record<string, string> = {
  'sutter-web.ch': 'Baumgartner Digital AG',
  'alpenblick-hotel.ch': 'Alpenblick Hospitality AG',
  'mueller-consulting.ch': 'Müller Consulting GmbH',
  'seeblick-apotheke.ch': 'Baumgartner Digital AG',
  'atelier-bern.ch': 'Atelier Bern GmbH',
  'm-p.ch': 'Alpenblick Hospitality AG',
  'berghotel-grindelwald.ch': 'Berghotel Grindelwald AG',
  'praxis-luzern.ch': 'Praxis Luzern AG',
  'kreativ-studio.ch': 'Kreativ Studio GmbH',
};

function presentDocument(document: GeneratedDocument): GeneratedDocument {
  const normalized = normalizeGeneratedDocument(document);
  if (normalized.legalEntity?.trim()) return normalized;

  const legalEntity = SWISS_LEGAL_ENTITY_BY_SITE[resolveDocumentSite(normalized)];
  if (!legalEntity) return normalized;

  documents.update(normalized.id, { legalEntity });
  return { ...normalized, legalEntity };
}

function listHostedPolicies(): GeneratedDocument[] {
  const all = documents.all();
  const keep = uniqueDocumentsBySite(all);
  const keepIds = new Set(keep.map((row) => row.id));
  for (const row of all) {
    if (!keepIds.has(row.id)) {
      documents.remove(row.id);
    }
  }
  return keep.map((row) => presentDocument(row));
}

function findHostedPolicyBySlug(slug: string): GeneratedDocument | undefined {
  return listHostedPolicies().find((row) => resolveHostedPolicySlug(row) === slug);
}

function findHostedPolicyByLegacy(id: string, site: string): GeneratedDocument | undefined {
  const normalizedSite = formatSiteDomain(site);
  return listHostedPolicies().find(
    (row) => row.id === id && resolveDocumentSite(row) === normalizedSite
  );
}

/**
 * Policy maintenance — operator-configurable in the real product, constants here.
 */
const POLICY_SCAN_SETTINGS: PolicyScanSettings = {
  automaticScanIntervalDays: 90,
  manualScanLimit: 3,
  manualScanWindowWeeks: 4,
};

type PolicyMaintenanceRecord = {
  /** Same value as the document id — one maintenance state per hosted policy. */
  id: string;
  lastScanDate: string | null;
  /** ISO dates of manual scans, oldest first. */
  manualScanDates: string[];
  lastUpdateSource: PolicyUpdateSource | null;
  services: PolicyService[];
  serviceRequests: PolicyServiceRequest[];
  basicInformation: PolicyBasicInformation;
};

const policyMaintenance = createCollection<PolicyMaintenanceRecord>('policy-maintenance', [], 2);

function seedDetectedServices(): PolicyService[] {
  const scannable = POLICY_SERVICE_CATALOG.filter((entry) => entry.scannable);

  return scannable.map((entry) => ({
    id: `svc-${entry.id}`,
    catalogId: entry.id,
    name: entry.name,
    categoryId: entry.categoryId,
    logoDomain: entry.logoDomain,
    detected: true,
    hidden: false,
  }));
}

function seedBasicInformation(document: GeneratedDocument): PolicyBasicInformation {
  const site = resolveDocumentSite(document);
  const legalEntity = document.legalEntity ?? '';
  const company = UID_COMPANIES.find((row) => row.name === legalEntity);
  const fallback = defaultPostalForEntity(legalEntity);

  return {
    companyName: legalEntity,
    domain: site,
    email: `info@${site}`,
    department: '',
    street: company?.street ?? fallback.postalLine1,
    streetLine2: '',
    postalCode: company?.postalCode ?? fallback.postalCode,
    city: company?.city ?? fallback.city,
    country: company?.country ?? fallback.country,
    hasDpo: 'no',
    dpoCompanyName: '',
    dpoDesignationEn: '',
    dpoDesignationDe: '',
    dpoDepartment: '',
    dpoStreet: '',
    dpoStreetLine2: '',
    dpoPostalCode: '',
    dpoCity: '',
    dpoCountry: 'Schweiz',
    dpoEmail: '',
    gdprApplicable: 'yes',
    offersToEU: 'yes',
    monitorsEUBehaviour: 'no',
    transfersAbroad: 'eea',
    usesProfiling: 'no',
    processesSpecialData: 'no',
    specialDataCategories: [],
    usesAiProcessing: 'no',
    acceptsApplications: 'yes',
    hasTalentPool: 'no',
    usesVideoSurveillance: 'no',
    videoRetention: '',
    videoRetentionAmount: '',
    videoRetentionUnit: '',
    hasThirdPartyEuRep: 'no',
    thirdPartyRepName: '',
    thirdPartyRepStreet: '',
    thirdPartyRepPostalCode: '',
    thirdPartyRepCity: '',
    thirdPartyRepCountry: '',
    thirdPartyRepEmail: '',
    basedInSwitzerland: 'yes',
  };
}

function readPolicyMaintenance(document: GeneratedDocument): PolicyMaintenanceRecord {
  const existing = policyMaintenance.all().find((row) => row.id === document.id);
  if (existing) return existing;

  return policyMaintenance.create({
    id: document.id,
    lastScanDate: document.createdDate,
    manualScanDates: [],
    lastUpdateSource: 'automaticScan',
    services: seedDetectedServices(),
    serviceRequests: [],
    basicInformation: seedBasicInformation(document),
  });
}

function countManualScansInWindow(record: PolicyMaintenanceRecord, now: Date): string[] {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - POLICY_SCAN_SETTINGS.manualScanWindowWeeks * 7);
  return record.manualScanDates.filter((iso) => new Date(iso) > windowStart);
}

function presentPolicyMaintenance(document: GeneratedDocument): PolicyMaintenanceState {
  const record = readPolicyMaintenance(document);
  const now = new Date();
  const inWindow = countManualScansInWindow(record, now);
  const oldestInWindow = inWindow[0];

  return {
    documentId: document.id,
    createdDate: document.createdDate,
    updatedDate: document.updatedDate,
    lastUpdateSource: record.lastUpdateSource,
    lastScanDate: record.lastScanDate,
    settings: POLICY_SCAN_SETTINGS,
    manualScansUsed: inWindow.length,
    manualScansRemaining: Math.max(0, POLICY_SCAN_SETTINGS.manualScanLimit - inWindow.length),
    manualScanWindowResetDate: oldestInWindow
      ? addDays(oldestInWindow.slice(0, 10), POLICY_SCAN_SETTINGS.manualScanWindowWeeks * 7)
      : null,
    services: record.services,
    serviceRequests: record.serviceRequests,
    basicInformation: record.basicInformation,
  };
}

/** Record a revision of the hosted policy and return the refreshed state. */
function applyPolicyRevision(
  document: GeneratedDocument,
  source: PolicyUpdateSource
): PolicyMaintenanceState {
  const record = readPolicyMaintenance(document);
  const today = new Date().toISOString().slice(0, 10);

  policyMaintenance.update(record.id, { lastUpdateSource: source });
  const updated = documents.update(document.id, { updatedDate: today }) ?? document;

  return presentPolicyMaintenance(presentDocument(updated));
}

const UID_COMPANIES: UidCompany[] = [
  {
    uid: 'CHE-123.456.789',
    name: 'Baumgartner Digital AG',
    street: 'Bahnhofstrasse 12',
    postalCode: '8001',
    city: 'Zürich',
    country: 'Schweiz',
  },
  {
    uid: 'CHE-109.876.543',
    name: 'Sutter Web GmbH',
    street: 'Industriestrasse 4',
    postalCode: '8600',
    city: 'Dübendorf',
    country: 'Schweiz',
  },
  {
    uid: 'CHE-456.789.012',
    name: 'Alpenblick Hotel AG',
    street: 'Dorfstrasse 18',
    postalCode: '3818',
    city: 'Grindelwald',
    country: 'Schweiz',
  },
  {
    uid: 'CHE-321.654.987',
    name: 'Müller Consulting GmbH',
    street: 'Seestrasse 22',
    postalCode: '6004',
    city: 'Luzern',
    country: 'Schweiz',
  },
  {
    uid: 'CHE-987.654.321',
    name: 'Kreativ Studio GmbH',
    street: 'Marktgasse 7',
    postalCode: '3011',
    city: 'Bern',
    country: 'Schweiz',
  },
];

export const handlers = [
  http.get('/api/contacts', () => HttpResponse.json(contacts.all())),

  http.post('/api/contacts', async ({ request }) => {
    const input = (await request.json()) as ContactCreate;
    return HttpResponse.json(contacts.create(input), { status: 201 });
  }),

  http.delete('/api/contacts/:id', ({ params }) => {
    const removed = contacts.remove(String(params.id));
    return new HttpResponse(null, { status: removed ? 204 : 404 });
  }),

  http.post('/api/contact-messages', async ({ request }) => {
    const input = (await request.json()) as ContactMessageCreate;
    return HttpResponse.json(
      contactMessages.create({
        ...input,
        createdAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.get('/api/affiliate/settings', () => {
    return HttpResponse.json(programSettings());
  }),

  http.get('/api/affiliate/applications/me', ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return HttpResponse.json(null);
    const row = affiliateApplications
      .all()
      .find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    return HttpResponse.json(row ?? null);
  }),

  http.post('/api/affiliate/applications', async ({ request }) => {
    const input = (await request.json()) as AffiliateApplicationCreate;
    const session = requireSessionEmail(request);
    if (session && session.toLowerCase() !== input.email.toLowerCase()) {
      return HttpResponse.json({ message: 'email_mismatch' }, { status: 400 });
    }
    const existing = affiliateApplications
      .all()
      .find((entry) => entry.email.toLowerCase() === input.email.toLowerCase());
    if (existing && existing.status === 'pending') {
      return HttpResponse.json(existing);
    }
    if (existing?.status === 'approved') {
      return HttpResponse.json({ message: 'already_partner' }, { status: 409 });
    }
    if (existing?.status === 'rejected') {
      return HttpResponse.json(
        affiliateApplications.update(existing.id, {
          ...input,
          status: 'pending',
          reviewedAt: null,
        })
      );
    }
    return HttpResponse.json(
      affiliateApplications.create({
        ...input,
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      }),
      { status: 201 }
    );
  }),

  http.get('/api/affiliate/dashboard/me', ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return HttpResponse.json(null);
    return HttpResponse.json(partnerDashboard(email));
  }),

  http.get('/api/affiliate/partner/me/visits', ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return new HttpResponse(null, { status: 401 });
    const partner = findPartnerByEmail(email);
    if (!partner) return new HttpResponse(null, { status: 404 });
    const visits: AffiliateVisit[] = partnerVisits(partner.id).map((row) => ({
      id: row.id,
      targetPath: row.targetPath,
      referrer: row.referrer,
      campaign: row.campaign,
      converted: row.referralId !== null,
      createdAt: row.createdAt,
    }));
    return HttpResponse.json(visits);
  }),

  http.get('/api/affiliate/partner/me/campaigns', ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return new HttpResponse(null, { status: 401 });
    const partner = findPartnerByEmail(email);
    if (!partner) return new HttpResponse(null, { status: 404 });
    const visits = partnerVisits(partner.id);
    const referralCampaign = new Map(
      visits.filter((row) => row.referralId).map((row) => [row.referralId, row.campaign])
    );
    const stats = new Map<string | null, AffiliateCampaignStats>();
    const entry = (campaign: string | null) => {
      const existing = stats.get(campaign);
      if (existing) return existing;
      const created: AffiliateCampaignStats = {
        campaign,
        visits: 0,
        referrals: 0,
        conversionRate: 0,
        earningsChf: 0,
      };
      stats.set(campaign, created);
      return created;
    };
    for (const visit of visits) entry(visit.campaign).visits += 1;
    for (const referral of affiliateReferrals.all()) {
      if (referral.partnerId !== partner.id || referral.status === 'rejected') continue;
      const row = entry(referralCampaign.get(referral.id) ?? null);
      row.referrals += 1;
      row.earningsChf = roundChf(row.earningsChf + referral.commissionChf);
    }
    const rows = [...stats.values()]
      .map((row) => ({
        ...row,
        conversionRate: row.visits > 0 ? row.referrals / row.visits : 0,
      }))
      .sort((a, b) => b.visits - a.visits);
    return HttpResponse.json(rows);
  }),

  http.patch('/api/affiliate/partner/me/slug', async ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return new HttpResponse(null, { status: 401 });
    const body = (await request.json()) as { slug?: string };
    const slug = body.slug?.trim() ?? '';
    const partner = findPartnerByEmail(email);
    if (!partner) return new HttpResponse(null, { status: 404 });
    if (!AFFILIATE_SLUG_PATTERN.test(slug)) {
      return HttpResponse.json({ message: 'slug_invalid' }, { status: 400 });
    }
    if (isPartnerSlugTaken(slug, partner.id)) {
      return HttpResponse.json({ message: 'slug_taken' }, { status: 409 });
    }
    const updated = affiliatePartners.update(partner.id, { slug });
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(partnerDto(updated));
  }),

  http.patch('/api/affiliate/partner/me/settings', async ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return new HttpResponse(null, { status: 401 });
    const partner = findPartnerByEmail(email);
    if (!partner) return new HttpResponse(null, { status: 404 });
    const body = (await request.json()) as {
      notificationEmail?: string;
      notifyOnReferral?: boolean;
    };
    const notificationEmail = body.notificationEmail?.trim() ?? '';
    if (!EMAIL_PATTERN.test(notificationEmail)) {
      return HttpResponse.json({ message: 'email_invalid' }, { status: 400 });
    }
    const updated = affiliatePartners.update(partner.id, {
      notificationEmail,
      notifyOnReferral: body.notifyOnReferral ?? partner.notifyOnReferral,
    });
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(partnerDto(updated));
  }),

  http.post('/api/affiliate/partner/me/referral-links', async ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return new HttpResponse(null, { status: 401 });
    const partner = findPartnerByEmail(email);
    if (!partner) return new HttpResponse(null, { status: 404 });
    const body = (await request.json()) as { targetPath?: string; campaign?: string };
    const targetPath = normalizeAffiliateTargetPath(body.targetPath ?? '');
    if (!targetPath) {
      return HttpResponse.json({ message: 'target_path_invalid' }, { status: 400 });
    }
    const campaign = body.campaign?.trim() || null;
    if (campaign && !AFFILIATE_CAMPAIGN_PATTERN.test(campaign)) {
      return HttpResponse.json({ message: 'campaign_invalid' }, { status: 400 });
    }
    const duplicate = partnerLinks(partner.id).find(
      (row) => row.targetPath === targetPath && row.campaign === campaign
    );
    if (duplicate) {
      return HttpResponse.json({ message: 'link_exists' }, { status: 409 });
    }
    const link = affiliateReferralLinks.create({
      id: `link-${partner.id}-${Date.now().toString(36)}`,
      partnerId: partner.id,
      targetPath,
      campaign,
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json(referralLinkDto(link, partner), { status: 201 });
  }),

  http.delete('/api/affiliate/partner/me/referral-links/:id', ({ request, params }) => {
    const email = requireSessionEmail(request);
    if (!email) return new HttpResponse(null, { status: 401 });
    const partner = findPartnerByEmail(email);
    if (!partner) return new HttpResponse(null, { status: 404 });
    const link = partnerLinks(partner.id).find((row) => row.id === params.id);
    if (!link) return new HttpResponse(null, { status: 404 });
    affiliateReferralLinks.remove(link.id);
    return HttpResponse.json({ ok: true as const });
  }),

  /** Visit on `/ref/:slug` — records the visit and returns the safe landing path. */
  http.post('/api/affiliate/clicks', async ({ request }) => {
    const body = (await request.json()) as {
      slug?: string;
      pathSegment?: string;
      targetPath?: string | null;
      campaign?: string | null;
      referrer?: string | null;
    };
    const slug = (body.slug ?? body.pathSegment)?.trim();
    if (!slug) return new HttpResponse(null, { status: 400 });
    const targetPath = safeTargetPath(body.targetPath ?? null) ?? '/';
    const campaign = body.campaign?.trim() || null;
    const found = findPartnerBySlug(slug);
    const partner = found?.status === 'active' ? found : undefined;
    if (partner) {
      const link = partnerLinks(partner.id).find(
        (row) => row.targetPath === targetPath && row.campaign === campaign
      );
      affiliateVisits.create({
        id: `visit-${partner.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        partnerId: partner.id,
        linkId: link?.id ?? null,
        targetPath,
        referrer: body.referrer?.trim() || null,
        campaign,
        referralId: null,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ ok: true as const, targetPath, attributed: Boolean(partner) });
  }),

  http.get('/api/affiliate/admin/applications', ({ request }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    return HttpResponse.json(affiliateApplications.all().sort(byNewest));
  }),

  http.post('/api/affiliate/admin/applications/:id/approve', ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const application = affiliateApplications.all().find((row) => row.id === params.id);
    if (!application) return new HttpResponse(null, { status: 404 });
    const partner = approveAffiliateApplication(application);
    if (!partner) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...partner, prototypeApprovalEmailSent: true });
  }),

  http.post('/api/affiliate/admin/applications/:id/reject', ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const application = affiliateApplications.all().find((row) => row.id === params.id);
    if (!application) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(
      affiliateApplications.update(application.id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
      })
    );
  }),

  http.post('/api/affiliate/prototype/simulate-approval-email', ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return new HttpResponse(null, { status: 401 });
    const application = affiliateApplications
      .all()
      .find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (!application) return new HttpResponse(null, { status: 404 });
    if (application.status === 'rejected') {
      return HttpResponse.json({ message: 'application_rejected' }, { status: 409 });
    }
    const partner = approveAffiliateApplication(application);
    if (!partner) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ referralUrl: partner.referralUrl });
  }),

  http.post('/api/affiliate/prototype/quit', ({ request }) => {
    const email = requireSessionEmail(request);
    if (!email) return new HttpResponse(null, { status: 401 });
    const partner = findPartnerByEmail(email);
    if (partner) removeAffiliatePartner(partner.id);
    const application = affiliateApplications
      .all()
      .find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (application) {
      affiliateApplications.update(application.id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ ok: true as const });
  }),

  http.patch('/api/affiliate/admin/settings', async ({ request }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const parsed = affiliateProgramSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return HttpResponse.json({ message: 'settings_invalid' }, { status: 400 });
    }
    affiliateSettings.update('program', parsed.data);
    return HttpResponse.json(programSettings());
  }),

  http.get('/api/affiliate/admin/partners/:id', ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const partner = findPartnerById(String(params.id));
    if (!partner) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(partnerDashboardFor(partner));
  }),

  http.patch('/api/affiliate/admin/partners/:id', async ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const partner = findPartnerById(String(params.id));
    if (!partner) return new HttpResponse(null, { status: 404 });
    const body = (await request.json()) as { commissionRate?: number };
    const rate = body.commissionRate;
    if (typeof rate !== 'number' || rate < 0 || rate > AFFILIATE_MAX_COMMISSION_PERCENT / 100) {
      return HttpResponse.json({ message: 'rate_invalid' }, { status: 400 });
    }
    const updated = affiliatePartners.update(partner.id, { commissionRate: rate });
    return HttpResponse.json(adminPartnerDto(updated ?? partner));
  }),

  http.post('/api/affiliate/admin/partners/:id/deactivate', ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const partner = findPartnerById(String(params.id));
    if (!partner) return new HttpResponse(null, { status: 404 });
    const updated = affiliatePartners.update(partner.id, {
      status: 'inactive',
      deactivatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(adminPartnerDto(updated ?? partner));
  }),

  http.post('/api/affiliate/admin/partners/:id/reactivate', ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const partner = findPartnerById(String(params.id));
    if (!partner) return new HttpResponse(null, { status: 404 });
    const updated = affiliatePartners.update(partner.id, { status: 'active', deactivatedAt: null });
    return HttpResponse.json(adminPartnerDto(updated ?? partner));
  }),

  http.get('/api/affiliate/admin/partners', ({ request }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    return HttpResponse.json(
      affiliatePartners
        .all()
        .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))
        .map(adminPartnerDto)
    );
  }),

  http.get('/api/affiliate/admin/referrals', ({ request }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const status = affiliateReferralStatusSchema.safeParse(
      new URL(request.url).searchParams.get('status')
    );
    const rows = affiliateReferrals
      .all()
      .filter((row) => !status.success || row.status === status.data)
      .sort(byNewest)
      .map(adminReferralDto)
      .filter((row): row is AffiliateAdminReferral => row !== null);
    return HttpResponse.json(rows);
  }),

  http.post('/api/affiliate/admin/referrals/:id/mark-order-paid', ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const referral = affiliateReferrals.all().find((row) => row.id === params.id);
    if (!referral) return new HttpResponse(null, { status: 404 });
    if (referral.status !== 'pending') {
      return HttpResponse.json({ message: 'referral_not_pending' }, { status: 409 });
    }
    const updated = affiliateReferrals.update(referral.id, { status: 'unpaid' });
    const partner = findPartnerById(referral.partnerId);
    const dto = updated ? adminReferralDto(updated) : null;
    if (!dto) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      ...dto,
      commissionEmailSentTo: partner?.notifyOnReferral ? partner.notificationEmail : null,
    });
  }),

  http.post('/api/affiliate/admin/referrals/:id/reject', ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const referral = affiliateReferrals.all().find((row) => row.id === params.id);
    if (!referral) return new HttpResponse(null, { status: 404 });
    if (referral.status === 'paid') {
      return HttpResponse.json({ message: 'referral_already_paid' }, { status: 409 });
    }
    const updated = affiliateReferrals.update(referral.id, { status: 'rejected' });
    const dto = updated ? adminReferralDto(updated) : null;
    if (!dto) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(dto);
  }),

  http.get('/api/affiliate/admin/payouts', ({ request }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    return HttpResponse.json(
      affiliatePayouts
        .all()
        .sort(byNewest)
        .map(adminPayoutDto)
        .filter((row): row is AffiliateAdminPayout => row !== null)
    );
  }),

  http.post('/api/affiliate/admin/payouts/preview', async ({ request }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const { partner, period } = readPayoutRequest(
      (await request.json()) as Partial<AffiliatePayoutRequest>
    );
    if (!partner) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(payoutPreview(partner, period));
  }),

  http.post('/api/affiliate/admin/payouts', async ({ request }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const { partner, period } = readPayoutRequest(
      (await request.json()) as Partial<AffiliatePayoutRequest>
    );
    if (!partner) return new HttpResponse(null, { status: 404 });
    const referrals = selectPayoutReferrals(partnerReferrals(partner.id), period);
    if (referrals.length === 0) {
      return HttpResponse.json({ message: 'nothing_to_pay' }, { status: 409 });
    }
    const payout = affiliatePayouts.create({
      id: `payout-${partner.id}-${Date.now().toString(36)}`,
      partnerId: partner.id,
      amountChf: roundChf(referrals.reduce((sum, row) => sum + row.commissionChf, 0)),
      ...period,
      referralIds: referrals.map((row) => row.id),
      status: 'invoice_requested',
      createdBy: sessionEmail(request) ?? 'admin',
      createdAt: new Date().toISOString(),
      transferredBy: null,
      transferredAt: null,
      invoiceEmailSentTo: partner.notificationEmail,
    });
    for (const row of referrals) {
      affiliateReferrals.update(row.id, { status: 'paid', payoutId: payout.id });
    }
    return HttpResponse.json(adminPayoutDto(payout), { status: 201 });
  }),

  http.post('/api/affiliate/admin/payouts/:id/mark-transferred', ({ request, params }) => {
    if (!requireAdmin(request)) return new HttpResponse(null, { status: 403 });
    const payout = affiliatePayouts.all().find((row) => row.id === params.id);
    if (!payout) return new HttpResponse(null, { status: 404 });
    if (payout.status === 'transferred') {
      return HttpResponse.json({ message: 'already_transferred' }, { status: 409 });
    }
    const updated = affiliatePayouts.update(payout.id, {
      status: 'transferred',
      transferredBy: sessionEmail(request) ?? 'admin',
      transferredAt: new Date().toISOString(),
    });
    return HttpResponse.json(adminPayoutDto(updated ?? payout));
  }),

  http.post('/api/dev/reseed-auth-mock', () => {
    authAccounts.reseed(createAuthAccountsSeed());
    profile.reseed([LUCAS_SEED_PROFILE, ADMIN_SEED_PROFILE]);
    setupTokens.reseed([]);
    magicLoginTokens.reseed([]);
    return HttpResponse.json({ ok: true as const });
  }),

  http.get('/api/dev/member-sign-in-method', () => {
    const account = findAuthAccountByEmail(MOCK_MEMBER_EMAIL);
    return HttpResponse.json({
      method: account ? resolveMemberSignInMethod(account) : ('magic_link' as const),
    });
  }),

  http.post('/api/dev/set-member-sign-in-method', async ({ request }) => {
    const body = (await request.json()) as { method?: 'magic_link' | 'password' };
    const account = findAuthAccountByEmail(MOCK_MEMBER_EMAIL);

    if (!account) {
      return HttpResponse.json({ message: 'not_found' }, { status: 404 });
    }

    if (body.method !== 'magic_link' && body.method !== 'password') {
      return HttpResponse.json({ message: 'invalid_method' }, { status: 400 });
    }

    if (body.method === 'magic_link') {
      authAccounts.update(account.id, {
        memberSignInMethod: 'magic_link',
        totpSecret: null,
        pendingTotpSecret: null,
        twoFactorActivatedAt: null,
        recoveryCodes: [],
        twoFactorSetupSuggested: true,
      });
    } else {
      authAccounts.update(account.id, { memberSignInMethod: 'password' });
    }

    const updated = findAuthAccountByEmail(MOCK_MEMBER_EMAIL);
    return HttpResponse.json({
      ok: true as const,
      method: updated ? resolveMemberSignInMethod(updated) : body.method,
    });
  }),

  http.post('/api/dev/disable-lucas-two-factor', () => {
    const account = findAuthAccountByEmail(MOCK_MEMBER_EMAIL);
    if (account) {
      authAccounts.update(account.id, {
        totpSecret: null,
        pendingTotpSecret: null,
        twoFactorActivatedAt: null,
        recoveryCodes: [],
        twoFactorSetupSuggested: true,
      });
    }
    return HttpResponse.json({ ok: true as const });
  }),

  http.post('/api/dev/reset-admin-two-factor', () => {
    const account = findAuthAccountByEmail(MOCK_ADMIN_EMAIL);
    if (account) {
      authAccounts.update(account.id, {
        totpSecret: null,
        pendingTotpSecret: null,
        twoFactorActivatedAt: null,
        recoveryCodes: [],
      });
    }
    return HttpResponse.json({ ok: true as const });
  }),

  http.post('/api/dev/admin-login-without-two-factor', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const account = email ? findAuthAccountByEmail(email) : undefined;

    if (!account || account.role !== 'admin' || body.password !== account.password) {
      return HttpResponse.json({ message: 'invalid_credentials' }, { status: 401 });
    }

    authAccounts.update(account.id, {
      totpSecret: null,
      pendingTotpSecret: null,
      twoFactorActivatedAt: null,
      recoveryCodes: [],
    });

    return HttpResponse.json({
      token: loginTokenForEmail(account.email),
      email: account.email,
    } satisfies LoginResponse);
  }),

  http.post('/api/auth/login/identify', async ({ request }) => {
    const input = (await request.json()) as LoginIdentifyInput;
    const email = input.email.trim().toLowerCase();
    const account = findAuthAccountByEmail(email);

    if (!account) {
      return HttpResponse.json({
        loginMethod: 'magic_link',
      });
    }

    if (account.role === 'member') {
      const preferred = resolveMemberSignInMethod(account);
      if (preferred === 'password') {
        return HttpResponse.json({
          loginMethod: 'password',
          role: account.role,
          ...twoFactorFlags(account),
        });
      }

      const magic = issueMagicLoginToken(email);
      return HttpResponse.json({
        loginMethod: 'magic_link',
        role: account.role,
        prototypeMagicLinkUrl: `/login/verify?token=${encodeURIComponent(magic.token)}`,
        ...twoFactorFlags(account),
      });
    }

    return HttpResponse.json({
      loginMethod: 'password',
      role: account.role,
      ...twoFactorFlags(account),
    });
  }),

  http.post('/api/auth/login/magic-link', async ({ request }) => {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();
    const row = token ? magicLoginTokens.all().find((entry) => entry.token === token) : undefined;
    const account = row ? findAuthAccountByEmail(row.email) : undefined;

    if (!row || !account || account.role !== 'member') {
      return HttpResponse.json({ message: 'invalid_token' }, { status: 400 });
    }

    if (!row.consumedAt) {
      magicLoginTokens.update(row.id, { consumedAt: new Date().toISOString() });
    }

    return HttpResponse.json({
      token: loginTokenForEmail(account.email),
      email: account.email,
    } satisfies LoginResponse);
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const input = (await request.json()) as LoginInput;
    const email = input.email.trim().toLowerCase();
    const account = findAuthAccountByEmail(email);

    if (!account || input.password !== account.password) {
      return HttpResponse.json({ message: 'invalid_credentials' }, { status: 401 });
    }

    if (account.totpSecret) {
      const accepted = input.recoveryCode
        ? consumeRecoveryCode(account, input.recoveryCode)
        : await verifyTotpCode(account.totpSecret, input.twoFactorCode ?? '');

      if (!accepted) {
        return HttpResponse.json({ message: 'invalid_two_factor' }, { status: 401 });
      }
    } else if (account.twoFactorRequired) {
      // Password was correct, but the account may not have a session until
      // an authenticator is configured.
      return HttpResponse.json({
        email,
        twoFactorSetupRequired: true,
        setupToken: issueSetupToken(email, false).token,
      } satisfies LoginResponse);
    }

    const accountAfterLogin = findAuthAccountByEmail(email);
    return HttpResponse.json({
      token: loginTokenForEmail(email),
      email,
      suggestTwoFactorSetup: shouldSuggestTwoFactorSetup(accountAfterLogin),
    } satisfies LoginResponse);
  }),

  http.get('/api/auth/session', ({ request }) => {
    const token = tokenFromRequest(request);
    const email = emailFromLoginToken(token);

    if (!email) {
      return HttpResponse.json({
        email: null,
        emailVerified: false,
      } satisfies Session);
    }

    const account = findAuthAccountByEmail(email);

    return HttpResponse.json({
      email,
      emailVerified: true,
      role: accountRole(email) ?? 'member',
      suggestTwoFactorSetup: shouldSuggestTwoFactorSetup(account),
    } satisfies Session);
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const input = (await request.json()) as RegisterInput;
    const hasDomain = Boolean(input.domain?.trim());
    const hasEuRep = Boolean(input.euRepEntityCount || input.euRepEntities?.length);
    if (!input.email || !input.acceptTerms || (!hasDomain && !hasEuRep)) {
      return HttpResponse.json({ message: 'invalid_registration' }, { status: 400 });
    }

    const verificationToken = `verify-${input.email.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    const existing = pendingRegistrations.all().find((row) => row.email === input.email);
    const saved = existing
      ? pendingRegistrations.update(existing.id, { ...input, verificationToken })
      : pendingRegistrations.create({ ...input, verificationToken });

    return HttpResponse.json({
      status: 'pending_verification' as const,
      email: saved?.email ?? input.email,
      verificationUrl: `/verify-email?token=${verificationToken}`,
    });
  }),

  http.post('/api/auth/verify-email', async ({ request }) => {
    const input = (await request.json()) as VerifyEmailInput;
    const pending = pendingRegistrations.all().find((row) => row.verificationToken === input.token);
    if (!pending) {
      return HttpResponse.json({ message: 'invalid_token' }, { status: 400 });
    }

    const isEuRepOnly = Boolean(
      (pending.euRepEntityCount || pending.euRepEntities?.length) && !pending.domain?.trim()
    );

    let documentId: string | undefined;
    let domain: string | undefined;
    let redirectTo: string | undefined;

    if (isEuRepOnly) {
      const planId = pending.euRepPlanId ?? 'basis';
      const entityCount = Math.max(
        1,
        pending.euRepEntityCount ?? pending.euRepEntities?.length ?? 1
      );
      const quote = calculateEuRepQuote(planId, entityCount);
      const session = checkoutSessions.create({
        status: 'pending',
        kind: 'euRep',
        siteCount: entityCount,
        amount: quote.amountDue,
        generatorAmount: 0,
        listPrice: quote.amountDue,
        discountRate: 0,
        discountAmount: 0,
        currency: 'CHF',
        euRepPlanId: planId,
        euRepEntityCount: entityCount,
        euRepEntities: pending.euRepEntities,
      });
      completeCheckoutSession(session.id);
      redirectTo = '/account?accountScope=euRep&section=euRep';
    } else {
      const existingPending = pending.domain
        ? findPendingCheckoutRecord(pending.domain)
        : undefined;
      if (existingPending?.documentId) {
        documentId = existingPending.documentId;
        domain = pending.domain;
      } else {
        const trial = startPolicyTrial({
          kind: 'generator',
          siteCount: 1,
          domain: pending.domain,
          policyName: pending.policyName,
          legalEntity: pending.legalEntity,
          fillSubscriptionId: pending.fillSubscriptionId,
          euRepPlanId: pending.euRepPlanId,
          euRepEntityCount: pending.euRepEntityCount,
          euRepEntities: pending.euRepEntities,
          euRepLinkContractId: pending.euRepLinkContractId,
        });
        documentId = trial?.documentId;
        domain = pending.domain;
      }
    }

    const email = pending.email.trim().toLowerCase();
    ensureAuthAccount(email, 'member');

    const profilePayload = {
      firstName: pending.firstName.trim(),
      lastName: pending.lastName.trim(),
      displayName: `${pending.firstName.trim()} ${pending.lastName.trim()}`.trim(),
      email,
      newsletterOptIn: pending.newsletter,
      role: 'member' as const,
      twoFactorEnabled: false,
    };
    const existingProfile = findProfileByEmail(email);
    const profileId = existingProfile?.id ?? profileIdForEmail(email);
    if (existingProfile) {
      profile.update(existingProfile.id, profilePayload);
    } else {
      profile.create({ ...profilePayload, id: profileId });
    }

    return HttpResponse.json({
      token: loginTokenForEmail(email),
      email,
      documentId,
      domain,
      redirectTo,
      prototypePassword: PROTOTYPE_REGISTERED_PASSWORD,
    });
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    const input = (await request.json()) as ForgotPasswordInput;
    if (!input.email) {
      return HttpResponse.json({ message: 'invalid_email' }, { status: 400 });
    }

    // Production mails this link; the prototype hands it back so the flow can
    // be walked through without an inbox. Unknown addresses get no link.
    const account = findAuthAccountByEmail(input.email);
    const setupUrl = account
      ? `/set-password?token=${issueSetupToken(account.email, true).token}`
      : undefined;

    return HttpResponse.json({ sent: true as const, prototypeSetupUrl: setupUrl });
  }),

  http.get('/api/account/snapshot', ({ request }) => {
    const member = isVerifiedAccount(tokenFromRequest(request));

    return HttpResponse.json({
      documentCount: member ? documents.all().length : 0,
    } satisfies AccountSnapshot);
  }),

  http.get('/api/account/billing-address', () => {
    const stored = billingAddress.all()[0];
    if (!stored) {
      return HttpResponse.json(null);
    }
    const { id: storedId, ...address } = stored;
    void storedId;
    return HttpResponse.json(address satisfies BillingAddress);
  }),

  http.put('/api/account/billing-address', async ({ request }) => {
    const input = (await request.json()) as BillingAddress;
    const existing = billingAddress.all()[0];
    const saved = existing
      ? billingAddress.update(existing.id, input)
      : billingAddress.create({ ...input, id: '1' });
    if (!saved) {
      return new HttpResponse(null, { status: 500 });
    }
    const { id: savedId, ...address } = saved;
    void savedId;
    return HttpResponse.json(address satisfies BillingAddress);
  }),

  http.get('/api/account/profile', ({ request }) => {
    const token = tokenFromRequest(request);
    const email = emailFromLoginToken(token);
    if (!email) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const stored = resolveProfileForEmail(email);
    const account = findAuthAccountByEmail(email);
    const role = account?.role ?? accountRole(email) ?? 'member';
    return HttpResponse.json({
      firstName: stored.firstName,
      lastName: stored.lastName,
      displayName: stored.displayName,
      email: stored.email,
      role,
      memberSignInMethod: resolveMemberSignInMethod(account),
      twoFactorEnabled: account ? isTwoFactorEnabled(account) : false,
    } satisfies Profile);
  }),

  http.patch('/api/account/sign-in-method', async ({ request }) => {
    const body = (await request.json()) as { method?: 'magic_link' | 'password' };
    const token = tokenFromRequest(request);
    const email = emailFromLoginToken(token);
    const account = email ? findAuthAccountByEmail(email) : undefined;

    if (!account || account.role !== 'member') {
      return HttpResponse.json({ message: 'forbidden' }, { status: 403 });
    }

    if (body.method !== 'magic_link' && body.method !== 'password') {
      return HttpResponse.json({ message: 'invalid_method' }, { status: 400 });
    }

    if (body.method === 'magic_link') {
      authAccounts.update(account.id, {
        memberSignInMethod: 'magic_link',
        totpSecret: null,
        pendingTotpSecret: null,
        twoFactorActivatedAt: null,
        recoveryCodes: [],
        twoFactorSetupSuggested: true,
      });
    } else {
      authAccounts.update(account.id, { memberSignInMethod: 'password' });
    }

    const stored = resolveProfileForEmail(account.email);
    const updated = findAuthAccountByEmail(account.email);
    return HttpResponse.json({
      firstName: stored.firstName,
      lastName: stored.lastName,
      displayName: stored.displayName,
      email: stored.email,
      role: 'member' as const,
      memberSignInMethod: resolveMemberSignInMethod(updated),
      twoFactorEnabled: updated ? isTwoFactorEnabled(updated) : false,
    } satisfies Profile);
  }),

  http.put('/api/account/profile', async ({ request }) => {
    const input = (await request.json()) as Profile;
    const token = tokenFromRequest(request);
    const sessionEmail = emailFromLoginToken(token);
    const email = normalizeProfileEmail(sessionEmail ?? input.email);
    const existing = findProfileByEmail(email);
    const account = findAuthAccountByEmail(email);
    const role = account?.role ?? accountRole(email) ?? 'member';
    const payload: Profile = {
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName,
      email,
      newsletterOptIn: input.newsletterOptIn,
      role,
      memberSignInMethod: resolveMemberSignInMethod(account),
      twoFactorEnabled: account ? isTwoFactorEnabled(account) : false,
    };
    const profileId = existing?.id ?? profileIdForEmail(email);
    const saved = existing
      ? profile.update(existing.id, payload)
      : profile.create({ ...payload, id: profileId });
    void saved;
    return HttpResponse.json(payload);
  }),

  http.put('/api/account/password', async ({ request }) => {
    const body = (await request.json()) as PasswordChange;
    const token = tokenFromRequest(request);
    const email = emailFromLoginToken(token);
    const account = email ? findAuthAccountByEmail(email) : undefined;

    if (!account || body.currentPassword !== account.password) {
      return HttpResponse.json({ message: 'invalid_password' }, { status: 400 });
    }

    authAccounts.update(account.id, { password: body.newPassword });
    return HttpResponse.json({ changed: true as const });
  }),

  http.get('/api/account/two-factor', ({ request }) => {
    const account = resolveTwoFactorAccount(request);
    if (!account) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }
    return HttpResponse.json(twoFactorStatus(account));
  }),

  http.post('/api/account/two-factor/setup', async ({ request }) => {
    const body = (await request.json()) as { setupToken?: string };
    const account = resolveTwoFactorAccount(request, body.setupToken);

    if (!account) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    // A fresh secret per setup attempt — abandoning the dialog must not leave
    // a usable authenticator entry behind.
    const secret = generateTotpSecret();
    authAccounts.update(account.id, { pendingTotpSecret: secret });

    return HttpResponse.json({
      secret,
      otpauthUri: buildOtpauthUri({
        secret,
        accountName: account.email,
        issuer: TWO_FACTOR_ISSUER,
      }),
      issuer: TWO_FACTOR_ISSUER,
      accountName: account.email,
      prototypeCode: await generateTotpCode(secret),
    } satisfies TwoFactorSetup);
  }),

  http.post('/api/account/two-factor/activate', async ({ request }) => {
    const body = (await request.json()) as { code: string; setupToken?: string };
    const account = resolveTwoFactorAccount(request, body.setupToken);

    if (!account) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const secret = account.pendingTotpSecret;
    if (!secret) {
      return HttpResponse.json({ message: 'setup_not_started' }, { status: 409 });
    }

    if (!(await verifyTotpCode(secret, body.code))) {
      return HttpResponse.json({ message: 'invalid_two_factor' }, { status: 400 });
    }

    const recoveryCodes = generateRecoveryCodes();
    const updated = authAccounts.update(account.id, {
      totpSecret: secret,
      pendingTotpSecret: null,
      twoFactorActivatedAt: new Date().toISOString(),
      recoveryCodes: recoveryCodes.map((code) => ({ code, usedAt: null })),
      twoFactorSetupSuggested: false,
    });

    return HttpResponse.json({
      status: twoFactorStatus(updated ?? account),
      recoveryCodes,
    } satisfies TwoFactorActivation);
  }),

  http.post('/api/account/two-factor/dismiss-setup-suggestion', ({ request }) => {
    const account = resolveTwoFactorAccount(request);

    if (!account) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    authAccounts.update(account.id, { twoFactorSetupSuggested: false });

    return HttpResponse.json({ ok: true as const });
  }),

  http.post('/api/account/two-factor/disable', async ({ request }) => {
    const body = (await request.json()) as { password: string };
    const account = resolveTwoFactorAccount(request);

    if (!account) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    if (body.password !== account.password) {
      return HttpResponse.json({ message: 'invalid_password' }, { status: 400 });
    }

    const updated = authAccounts.update(account.id, {
      totpSecret: null,
      pendingTotpSecret: null,
      twoFactorActivatedAt: null,
      recoveryCodes: [],
    });

    return HttpResponse.json(twoFactorStatus(updated ?? account));
  }),

  http.post('/api/account/two-factor/recovery-codes', async ({ request }) => {
    const body = (await request.json()) as { code: string };
    const account = resolveTwoFactorAccount(request);

    if (!account?.totpSecret) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    if (!(await verifyTotpCode(account.totpSecret, body.code))) {
      return HttpResponse.json({ message: 'invalid_two_factor' }, { status: 400 });
    }

    const recoveryCodes = generateRecoveryCodes();
    const updated = authAccounts.update(account.id, {
      recoveryCodes: recoveryCodes.map((code) => ({ code, usedAt: null })),
    });

    return HttpResponse.json({
      status: twoFactorStatus(updated ?? account),
      recoveryCodes,
    } satisfies TwoFactorActivation);
  }),

  http.post('/api/auth/invite/validate', async ({ request }) => {
    const body = (await request.json()) as { token: string };
    const invite = findSetupToken(body.token);
    const account = invite ? findAuthAccountByEmail(invite.email) : undefined;

    if (!invite || !account) {
      return HttpResponse.json({ message: 'invalid_token' }, { status: 400 });
    }

    return HttpResponse.json({
      email: account.email,
      needsPassword: invite.needsPassword,
      twoFactorRequired: account.twoFactorRequired,
      twoFactorEnabled: isTwoFactorEnabled(account),
    } satisfies InviteValidation);
  }),

  http.post('/api/auth/invite/complete', async ({ request }) => {
    const body = (await request.json()) as { token: string; password?: string };
    const invite = findSetupToken(body.token);
    const account = invite ? findAuthAccountByEmail(invite.email) : undefined;

    if (!invite || !account) {
      return HttpResponse.json({ message: 'invalid_token' }, { status: 400 });
    }

    if (invite.needsPassword) {
      if (!body.password) {
        return HttpResponse.json({ message: 'password_required' }, { status: 400 });
      }
      authAccounts.update(account.id, { password: body.password });
    }

    if (account.twoFactorRequired && !isTwoFactorEnabled(account)) {
      return HttpResponse.json({ message: 'two_factor_required' }, { status: 409 });
    }

    setupTokens.update(invite.id, { consumedAt: new Date().toISOString() });

    return HttpResponse.json({
      token: loginTokenForEmail(account.email),
      email: account.email,
    } satisfies LoginResponse);
  }),

  http.get('/api/billing/subscriptions/:id', ({ request, params }) => {
    if (!isVerifiedAccount(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const subscription = subscriptions.all().find((row) => row.id === String(params.id));
    if (!subscription) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(subscription);
  }),

  http.get('/api/billing/subscriptions', ({ request }) =>
    HttpResponse.json(isVerifiedAccount(tokenFromRequest(request)) ? subscriptions.all() : [])
  ),

  http.post('/api/billing/subscriptions/:id/cancel', ({ params }) => {
    // Access (and EU Rep coverage on hosted policies) runs until the paid term ends.
    const updated = subscriptions.update(String(params.id), { status: 'cancelled' });
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.post('/api/billing/subscriptions/:id/continue', ({ params }) => {
    const existing = subscriptions.all().find((row) => row.id === String(params.id));
    if (!existing) {
      return new HttpResponse(null, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const updated = shouldStartNewTermOnContinue(existing)
      ? startNewSubscriptionTerm(existing, today).subscription
      : subscriptions.update(existing.id, { status: 'active' });
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.patch('/api/billing/subscriptions/:id/billing', async ({ params, request }) => {
    const input = (await request.json()) as SubscriptionBillingUpdate;
    const updated = subscriptions.update(String(params.id), input);
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.get('/api/billing/orders', ({ request }) =>
    HttpResponse.json(isVerifiedAccount(tokenFromRequest(request)) ? orders.all() : [])
  ),

  http.post('/api/billing/eu-rep/extra-request', async ({ request }) => {
    if (!isVerifiedAccount(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const input = (await request.json()) as EuRepExtraRequestCreate;
    const quantity = Math.max(1, Math.floor(input.quantity));
    const subscription = subscriptions
      .all()
      .find((row) => row.id === input.subscriptionId && row.productType === 'euRep');
    if (!subscription || !subscriptionGrantsProductAccess(subscription)) {
      return HttpResponse.json({ message: 'Subscription not found' }, { status: 404 });
    }

    const today = new Date().toISOString();
    const requestId = `extra-req-${crypto.randomUUID()}`;

    const updated = subscriptions.update(subscription.id, {
      requestedExtraRequests: [
        ...(subscription.requestedExtraRequests ?? []),
        { id: requestId, quantity, requestedDate: today },
      ],
    });

    return HttpResponse.json(updated, { status: 201 });
  }),

  http.delete('/api/billing/eu-rep/extra-request', async ({ request }) => {
    if (!isVerifiedAccount(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const input = (await request.json()) as EuRepExtraRequestWithdraw;
    const subscription = subscriptions
      .all()
      .find((row) => row.id === input.subscriptionId && row.productType === 'euRep');
    if (!subscription) {
      return HttpResponse.json({ message: 'Subscription not found' }, { status: 404 });
    }

    const pending = subscription.requestedExtraRequests ?? [];
    const match = pending.find((row) => row.id === input.requestId);
    if (!match) {
      return HttpResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    const updated = subscriptions.update(subscription.id, {
      requestedExtraRequests: pending.filter((row) => row.id !== input.requestId),
    });

    return HttpResponse.json(updated);
  }),

  http.get('/api/documents', () => HttpResponse.json(listHostedPolicies())),

  http.get('/api/check/site-policy', ({ request }) => {
    const domain = extractDomainHost(new URL(request.url).searchParams.get('domain') ?? '');
    if (!domain) {
      return HttpResponse.json({ exists: false });
    }
    const document = findDocumentBySiteForAccount(
      emailFromLoginToken(tokenFromRequest(request)),
      domain
    );
    if (!document) {
      return HttpResponse.json({ exists: false });
    }
    return HttpResponse.json({
      exists: true,
      displayName: formatSiteDomain(resolveDocumentSite(document)),
      href: privacyPolicyAccountHref({ site: formatSiteDomain(resolveDocumentSite(document)) }),
    });
  }),

  http.get('/api/check/eu-rep', ({ request }) => {
    const legalEntity = new URL(request.url).searchParams.get('legalEntity') ?? '';
    const contract = findActiveEuRepContractForLegalEntity(legalEntity);
    if (!contract) {
      return HttpResponse.json({ exists: false });
    }
    return HttpResponse.json({
      exists: true,
      displayName: contract.legalEntity,
      href: euRepAccountHref({ contract: contract.id }),
    });
  }),

  http.get('/api/documents/:id', ({ params }) => {
    const id = String(params.id);
    const document = documents.all().find((row) => row.id === id);
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(presentDocument(document));
  }),

  http.get('/api/hosted-policies/legacy/:id/:site', ({ params }) => {
    const document = findHostedPolicyByLegacy(String(params.id), String(params.site));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      document,
      slug: resolveHostedPolicySlug(document),
      path: buildHostedPolicyPath(document),
    });
  }),

  http.get('/api/hosted-policies/:slug', ({ params }) => {
    const slug = String(params.slug);
    const document = findHostedPolicyBySlug(slug);
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(document);
  }),

  http.get('/api/policy-services/catalog', () => HttpResponse.json(POLICY_SERVICE_CATALOG)),

  http.get('/api/documents/:id/policy-state', ({ params }) => {
    const document = documents.all().find((row) => row.id === String(params.id));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(presentPolicyMaintenance(presentDocument(document)));
  }),

  http.post('/api/documents/:id/policy-state/scan', ({ params }) => {
    const document = documents.all().find((row) => row.id === String(params.id));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const record = readPolicyMaintenance(document);
    const now = new Date();
    if (countManualScansInWindow(record, now).length >= POLICY_SCAN_SETTINGS.manualScanLimit) {
      return HttpResponse.json({ message: 'Manual scan limit reached' }, { status: 429 });
    }

    const today = now.toISOString().slice(0, 10);
    /* Manual rescan compares the live site to the last known snapshot — prototype default: unchanged. */
    policyMaintenance.update(record.id, {
      lastScanDate: today,
      manualScanDates: [...record.manualScanDates, now.toISOString()],
    });

    return HttpResponse.json({
      state: presentPolicyMaintenance(presentDocument(document)),
      changesFound: false,
    });
  }),

  http.put('/api/documents/:id/policy-state/basic-information', async ({ params, request }) => {
    const document = documents.all().find((row) => row.id === String(params.id));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const input = (await request.json()) as PolicyBasicInformation;
    const record = readPolicyMaintenance(document);
    policyMaintenance.update(record.id, { basicInformation: input });

    if (input.companyName.trim()) {
      documents.update(document.id, { legalEntity: input.companyName.trim() });
    }

    return HttpResponse.json(applyPolicyRevision(document, 'basicInformation'));
  }),

  http.post('/api/documents/:id/policy-state/services', async ({ params, request }) => {
    const document = documents.all().find((row) => row.id === String(params.id));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const { catalogId } = (await request.json()) as { catalogId: string };
    const entry = findPolicyServiceCatalogEntry(catalogId);
    if (!entry) {
      return HttpResponse.json({ message: 'Unknown service' }, { status: 400 });
    }

    const record = readPolicyMaintenance(document);
    const existing = record.services.find((row) => row.catalogId === catalogId);
    if (existing) {
      /* Re-adding a dismissed service simply puts it back into the policy. */
      policyMaintenance.update(record.id, {
        services: record.services.map((row) =>
          row.catalogId === catalogId ? { ...row, hidden: false } : row
        ),
      });
    } else {
      policyMaintenance.update(record.id, {
        services: [
          ...record.services,
          {
            id: `svc-${entry.id}`,
            catalogId: entry.id,
            name: entry.name,
            categoryId: entry.categoryId,
            logoDomain: entry.logoDomain,
            detected: false,
            hidden: false,
          },
        ],
      });
    }

    return HttpResponse.json(applyPolicyRevision(document, 'services'));
  }),

  http.patch('/api/documents/:id/policy-state/services/:serviceId', async ({ params, request }) => {
    const document = documents.all().find((row) => row.id === String(params.id));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const serviceId = String(params.serviceId);
    const { hidden } = (await request.json()) as { hidden: boolean };
    const record = readPolicyMaintenance(document);
    const service = record.services.find((row) => row.id === serviceId);
    if (!service) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    policyMaintenance.update(record.id, {
      services: record.services.map((row) => (row.id === serviceId ? { ...row, hidden } : row)),
    });

    return HttpResponse.json(applyPolicyRevision(document, 'services'));
  }),

  http.post('/api/documents/:id/policy-state/service-requests', async ({ params, request }) => {
    const document = documents.all().find((row) => row.id === String(params.id));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const input = (await request.json()) as PolicyServiceRequestCreate;
    const record = readPolicyMaintenance(document);
    const today = new Date().toISOString().slice(0, 10);

    policyMaintenance.update(record.id, {
      serviceRequests: [
        ...record.serviceRequests,
        {
          id: `req-${String(Date.now())}`,
          name: input.name.trim(),
          url: input.url?.trim() || undefined,
          note: input.note?.trim() || undefined,
          requestedDate: today,
          status: 'pending',
        },
      ],
    });

    return HttpResponse.json(presentPolicyMaintenance(presentDocument(document)));
  }),

  http.delete('/api/documents/:id/policy-state/service-requests/:requestId', ({ params }) => {
    const document = documents.all().find((row) => row.id === String(params.id));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const record = readPolicyMaintenance(document);
    const requestId = String(params.requestId);
    const target = record.serviceRequests.find((row) => row.id === requestId);
    if (!target) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    policyMaintenance.update(record.id, {
      serviceRequests: record.serviceRequests.filter((row) => row.id !== requestId),
    });

    return HttpResponse.json(presentPolicyMaintenance(presentDocument(document)));
  }),

  http.post('/api/documents/:id/regenerate', ({ params }) => {
    const id = String(params.id);
    const existing = documents.all().find((row) => row.id === id);
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const updated = documents.update(id, {
      updatedDate: today,
    });

    return HttpResponse.json(presentDocument(updated ?? existing));
  }),

  http.get('/api/uid-registry/search', ({ request }) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    if (query.length < 2) {
      return HttpResponse.json([]);
    }

    const results = UID_COMPANIES.filter((company) => {
      const haystack = [company.uid, company.name, company.city, company.street, company.postalCode]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    }).slice(0, 8);

    return HttpResponse.json(results);
  }),

  http.get('/api/generator/plan', ({ request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json(null);
    }
    const allSubscriptions = subscriptions.all();
    const allDocuments = documents.all();
    const policyRows = allSubscriptions.filter(
      (row) => row.productType === 'policy' && row.status === 'active'
    );
    let availableSiteSlots = 0;
    let slotSubscriptionId: string | undefined;
    for (const row of policyRows) {
      const available = countAvailablePolicySlots(row, allDocuments);
      availableSiteSlots += available;
      if (!slotSubscriptionId && available > 0) {
        slotSubscriptionId = row.id;
      }
    }

    return HttpResponse.json({
      activeSubscriptionCount: countActivePolicySubscriptions(allSubscriptions),
      availableSiteSlots,
      slotSubscriptionId,
    });
  }),

  http.get('/api/eu-rep/contracts', ({ request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json([]);
    }
    return HttpResponse.json(euRepContracts.all());
  }),

  http.post('/api/eu-rep/contracts', async ({ request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const input = (await request.json()) as EuRepContractCreate;
    const subscription = subscriptions
      .all()
      .find((row) => row.id === input.subscriptionId && row.productType === 'euRep');
    if (!subscription || subscription.status !== 'active') {
      return HttpResponse.json({ message: 'Subscription not found' }, { status: 404 });
    }

    const created = euRepContracts.create({
      subscriptionId: input.subscriptionId,
      legalEntity: input.legalEntity,
      forwardingEmail: input.forwardingEmail,
      postalDepartment: input.postalDepartment,
      postalLine1: input.postalLine1,
      postalLine2: input.postalLine2,
      postalCode: input.postalCode,
      city: input.city,
      country: input.country,
      linkedDocumentIds: [],
      status: 'active',
    });

    const entityCount = euRepContracts
      .all()
      .filter(
        (row) => row.subscriptionId === input.subscriptionId && row.status === 'active'
      ).length;
    subscriptions.update(subscription.id, { legalEntityCount: entityCount });

    return HttpResponse.json(created, { status: 201 });
  }),

  http.get('/api/eu-rep/contracts/:id', ({ request, params }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const contract = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!contract) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(contract);
  }),

  http.patch('/api/eu-rep/contracts/:id', async ({ params, request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const existing = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const input = (await request.json()) as EuRepContractUpdate;
    const legalEntityChanged = input.legalEntity !== existing.legalEntity;
    const updated = euRepContracts.update(existing.id, {
      legalEntity: input.legalEntity,
      forwardingEmail: input.forwardingEmail,
      postalDepartment: input.postalDepartment,
      postalLine1: input.postalLine1,
      postalLine2: input.postalLine2,
      postalCode: input.postalCode,
      city: input.city,
      country: input.country,
    });
    if (legalEntityChanged) {
      for (const id of existing.linkedDocumentIds) {
        documents.update(id, { legalEntity: input.legalEntity });
      }
    }
    return HttpResponse.json(updated ?? existing);
  }),

  http.delete('/api/eu-rep/contracts/:id', ({ params, request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const contract = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!contract) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const subscription = subscriptions.all().find((row) => row.id === contract.subscriptionId);
    if (
      subscription &&
      (subscription.status === 'active' || subscription.status === 'processing')
    ) {
      return HttpResponse.json({ message: 'subscription_active' }, { status: 409 });
    }
    euRepContracts.remove(contract.id);
    if (subscription) {
      const remaining = euRepContracts
        .all()
        .filter((row) => row.subscriptionId === subscription.id).length;
      if (remaining > 0) {
        subscriptions.update(subscription.id, { legalEntityCount: remaining });
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/eu-rep/contracts/:id/documents', async ({ params, request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const contract = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!contract || contract.status !== 'active') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    (await request.json()) as EuRepLinkDocuments;
    return HttpResponse.json(
      euRepContracts.all().find((row) => row.id === contract.id) ?? contract
    );
  }),

  http.delete('/api/eu-rep/contracts/:id/documents/:documentId', ({ params, request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const contract = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!contract || contract.status !== 'active') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(
      euRepContracts.all().find((row) => row.id === contract.id) ?? contract
    );
  }),

  http.get('/api/checkout/pending', ({ request }) => {
    const url = new URL(request.url);
    const site = url.searchParams.get('site');
    if (!site) {
      return HttpResponse.json({ needed: false });
    }
    return HttpResponse.json(resolvePendingCheckoutForSite(site));
  }),

  http.post('/api/checkout/trial', async ({ request }) => {
    const input = (await request.json()) as CheckoutSessionCreate;
    try {
      const trial = startPolicyTrial(input);
      if (!trial) {
        return HttpResponse.json({ message: 'trial_failed' }, { status: 400 });
      }
      return HttpResponse.json(trial, { status: 201 });
    } catch {
      return HttpResponse.json({ message: 'trial_failed' }, { status: 400 });
    }
  }),

  http.post('/api/checkout/pending/complete', ({ request }) => {
    const url = new URL(request.url);
    const site = url.searchParams.get('site');
    const pending = findPendingCheckoutRecord(site);
    if (!pending) {
      return HttpResponse.json({ message: 'not_found' }, { status: 404 });
    }

    const session = checkoutSessions.create({
      status: 'pending',
      kind: 'generator',
      siteCount: 1,
      amount: 0,
      generatorAmount: 0,
      listPrice: 0,
      discountRate: 0,
      discountAmount: 0,
      currency: 'CHF',
      domain: pending.domain,
      legalEntity: pending.legalEntity,
      fillSubscriptionId: pending.fillSubscriptionId,
      euRepEntityCount: pending.euRepEntityCount,
      euRepEntities: pending.euRepEntities,
      euRepLinkContractId: pending.euRepLinkContractId,
      subscriptionId: pending.subscriptionId,
      documentId: pending.documentId,
    });

    const today = new Date().toISOString().slice(0, 10);
    const nextPaymentDate = addOneYear(today);
    const activeSites = countActivePolicySites(subscriptions.all());
    const quote = pending.fillSubscriptionId
      ? {
          listPrice: 0,
          discountRate: 0,
          discountAmount: 0,
          amountDue: 0,
        }
      : calculateGeneratorPolicyQuote(
          qualifyingSiteCountForCheckout(activeSites, 'generator', 1),
          1
        );
    const euRepQuote =
      pending.euRepEntityCount || pending.euRepEntities?.length
        ? calculateEuRepQuote(pending.euRepPlanId ?? 'basis')
        : null;
    const generatorAmount = quote.amountDue;
    const totalAmount = generatorAmount + (euRepQuote?.amountDue ?? 0);

    if (pending.subscriptionId && !pending.fillSubscriptionId) {
      const policySub = subscriptions.all().find((row) => row.id === pending.subscriptionId);
      if (policySub) {
        const policyOrder = orders.create({
          productType: 'policy',
          number: nextOrderNumber(),
          date: today,
          status: 'active',
          total: generatorAmount,
          currency: 'CHF',
          siteCount: 1,
          discountAmount: quote.discountAmount > 0 ? quote.discountAmount : undefined,
          discountRate: quote.discountRate > 0 ? quote.discountRate : undefined,
          subscriptionId: policySub.id,
          orderKind: 'subscription',
        });
        subscriptions.update(policySub.id, {
          trialEndsAt: undefined,
          lastOrderDate: today,
          nextPaymentDate,
          totals: {
            ...policySub.totals,
            subtotal: quote.listPrice,
            discount: quote.discountAmount,
            total: generatorAmount,
          },
          relatedOrderIds: [...policySub.relatedOrderIds, policyOrder.id],
        });
        checkoutSessions.update(session.id, {
          status: 'completed',
          orderId: policyOrder.id,
          amount: totalAmount,
          generatorAmount,
          listPrice: quote.listPrice,
          discountRate: quote.discountRate,
          discountAmount: quote.discountAmount,
        });
      }
    }

    if (pending.euRepEntityCount || pending.euRepEntities?.length) {
      const existingEuTrial = subscriptions
        .all()
        .find(
          (row) =>
            row.productType === 'euRep' && row.status === 'active' && Boolean(row.trialEndsAt)
        );

      if (existingEuTrial) {
        const euOrder = orders.create({
          productType: 'euRep',
          number: nextOrderNumber(),
          date: today,
          status: 'active',
          total: euRepQuote?.amountDue ?? 149,
          currency: 'CHF',
          legalEntityCount: existingEuTrial.legalEntityCount ?? 1,
          planId: existingEuTrial.planId,
          orderKind: 'subscription',
          subscriptionId: existingEuTrial.id,
        });
        subscriptions.update(existingEuTrial.id, {
          trialEndsAt: undefined,
          lastOrderDate: today,
          nextPaymentDate,
          totals: {
            ...existingEuTrial.totals,
            subtotal: euRepQuote?.amountDue ?? existingEuTrial.totals.total,
            total: euRepQuote?.amountDue ?? existingEuTrial.totals.total,
          },
          relatedOrderIds: [...existingEuTrial.relatedOrderIds, euOrder.id],
        });
      } else {
        createEuRepPurchase(
          {
            ...session,
            amount: totalAmount,
            generatorAmount,
            euRepPlanId: pending.euRepPlanId ?? 'basis',
            euRepEntityCount: pending.euRepEntityCount,
            euRepEntities: pending.euRepEntities,
          },
          today
        );
      }
    }

    if (pending.id !== '__synthetic__') {
      pendingCheckouts.remove(pending.id);
    }

    return HttpResponse.json({
      sessionId: session.id,
      orderId: session.orderId ?? pending.subscriptionId ?? pending.documentId ?? session.id,
      document: pending.documentId
        ? documents.all().find((row) => row.id === pending.documentId)
        : undefined,
      activeSubscriptionCount: countActivePolicySubscriptions(subscriptions.all()),
      nextPaymentDate,
    });
  }),

  http.post('/api/checkout/sessions', async ({ request }) => {
    const input = (await request.json()) as CheckoutSessionCreate;

    if (input.kind === 'subscriptionRenewal') {
      const existing = subscriptions.all().find((row) => row.id === input.subscriptionId);
      if (!existing) {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      }
      const quote = subscriptionRenewalQuote(existing);
      const session = checkoutSessions.create({
        status: 'pending',
        kind: input.kind,
        siteCount: existing.productType === 'policy' ? resolvePolicySiteCount(existing) : 1,
        amount: quote.amountDue,
        generatorAmount: existing.productType === 'policy' ? quote.amountDue : 0,
        listPrice: quote.listPrice,
        discountRate: quote.discountRate,
        discountAmount: quote.discountAmount,
        currency: 'CHF',
        euRepPlanId:
          existing.productType === 'euRep'
            ? ((existing.planId ?? 'basis') as EuRepPlanId)
            : undefined,
        subscriptionId: existing.id,
        returnUrl: input.returnUrl,
      });
      return HttpResponse.json(
        {
          id: session.id,
          // POC STUB (Payrexx): the real backend returns the Payrexx gateway URL.
          redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
          amount: session.amount,
          currency: session.currency,
          siteCount: session.siteCount,
          listPrice: session.listPrice,
          discountRate: session.discountRate,
          discountAmount: session.discountAmount,
        },
        { status: 201 }
      );
    }

    if (input.kind === 'euRep') {
      const entityCount = Math.max(1, input.euRepEntityCount ?? input.euRepEntities?.length ?? 1);
      const planId = input.euRepPlanId ?? 'basis';
      const quote = calculateEuRepQuote(planId, entityCount);
      const promoDiscount = input.promoCode ? resolvePromoCode(input.promoCode) : null;
      const listPrice = quote.amountDue;
      const discountAmount = promoDiscount
        ? calculatePromoDiscountAmount(listPrice, promoDiscount)
        : 0;
      const amountDue = promoDiscount ? applyPromoDiscount(listPrice, promoDiscount) : listPrice;
      const session = checkoutSessions.create({
        status: 'pending',
        kind: input.kind,
        siteCount: entityCount,
        amount: amountDue,
        generatorAmount: 0,
        listPrice,
        discountRate: listPrice > 0 ? discountAmount / listPrice : 0,
        discountAmount,
        currency: 'CHF',
        euRepPlanId: planId,
        euRepEntityCount: entityCount,
        euRepEntities: input.euRepEntities,
        promoCode: promoDiscount ? normalizePromoCode(input.promoCode ?? '') : undefined,
      });

      return HttpResponse.json(
        {
          id: session.id,
          // POC STUB (Payrexx): the real backend returns the Payrexx gateway URL.
          redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
          amount: session.amount,
          currency: session.currency,
          siteCount: session.siteCount,
          listPrice: session.listPrice,
          discountRate: session.discountRate,
          discountAmount: session.discountAmount,
        },
        { status: 201 }
      );
    }

    const activeSites = countActivePolicySites(subscriptions.all());
    const siteCount = Math.max(1, input.siteCount ?? 1);

    if (input.fillSubscriptionId && input.domain && input.kind === 'generator') {
      const slotSubscription = subscriptions
        .all()
        .find((row) => row.id === input.fillSubscriptionId);
      if (
        !slotSubscription ||
        slotSubscription.productType !== 'policy' ||
        slotSubscription.status !== 'active' ||
        countAvailablePolicySlots(slotSubscription, documents.all()) <= 0
      ) {
        return HttpResponse.json({ message: 'No subscription slot available' }, { status: 400 });
      }

      const euRepEntityCount = input.euRepEntityCount ?? input.euRepEntities?.length;
      let amount = 0;
      if (euRepEntityCount) {
        amount += calculateEuRepQuote(input.euRepPlanId ?? 'basis').amountDue;
      }

      const session = checkoutSessions.create({
        status: 'pending',
        kind: input.kind,
        siteCount: 1,
        amount,
        generatorAmount: 0,
        listPrice: 0,
        discountRate: 0,
        discountAmount: 0,
        currency: 'CHF',
        domain: input.domain,
        policyName: input.policyName,
        legalEntity: input.legalEntity,
        euRepPlanId: euRepEntityCount ? (input.euRepPlanId ?? 'basis') : undefined,
        euRepEntityCount,
        euRepEntities: input.euRepEntities,
        euRepLinkContractId: input.euRepLinkContractId,
        fillSubscriptionId: input.fillSubscriptionId,
      });

      return HttpResponse.json(
        {
          id: session.id,
          // POC STUB (Payrexx): the real backend returns the Payrexx gateway URL.
          redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
          amount: session.amount,
          currency: session.currency,
          siteCount: session.siteCount,
          listPrice: session.listPrice,
          discountRate: session.discountRate,
          discountAmount: session.discountAmount,
        },
        { status: 201 }
      );
    }

    const qualifyingSites = qualifyingSiteCountForCheckout(activeSites, input.kind, siteCount);
    const quote = calculateGeneratorPolicyQuote(qualifyingSites, siteCount);

    let amount = quote.amountDue;
    const euRepEntityCount = input.euRepEntityCount ?? input.euRepEntities?.length;
    if (euRepEntityCount) {
      amount += calculateEuRepQuote(input.euRepPlanId ?? 'basis').amountDue;
    }

    const session = checkoutSessions.create({
      status: 'pending',
      kind: input.kind,
      siteCount,
      amount,
      generatorAmount: quote.amountDue,
      listPrice: quote.listPrice,
      discountRate: quote.discountRate,
      discountAmount: quote.discountAmount,
      currency: 'CHF',
      domain: input.domain,
      policyName: input.policyName,
      legalEntity: input.legalEntity,
      euRepPlanId: euRepEntityCount ? (input.euRepPlanId ?? 'basis') : undefined,
      euRepEntityCount,
      euRepEntities: input.euRepEntities,
      euRepLinkContractId: input.euRepLinkContractId,
      subscriptionId: input.subscriptionId,
    });

    return HttpResponse.json(
      {
        id: session.id,
        // POC STUB (Payrexx): the real backend returns the Payrexx gateway URL.
        redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
        amount: session.amount,
        currency: session.currency,
        siteCount: session.siteCount,
        listPrice: session.listPrice,
        discountRate: session.discountRate,
        discountAmount: session.discountAmount,
      },
      { status: 201 }
    );
  }),

  http.get('/api/checkout/sessions/:id', ({ params }) => {
    const session = checkoutSessions.all().find((row) => row.id === String(params.id));
    if (!session) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const subscription = session.subscriptionId
      ? subscriptions.all().find((row) => row.id === session.subscriptionId)
      : undefined;
    return HttpResponse.json({
      id: session.id,
      // POC STUB (Payrexx): the real backend returns the Payrexx gateway URL.
      redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
      amount: session.amount,
      currency: session.currency,
      siteCount: session.siteCount,
      listPrice: session.listPrice,
      discountRate: session.discountRate,
      discountAmount: session.discountAmount,
      status: session.status,
      kind: session.kind,
      description: subscription?.totals.product ?? subscription?.product ?? 'Datenschutzpartner',
      subscriptionId: session.subscriptionId,
      returnUrl: session.returnUrl,
      orderContext: checkoutSessionOrderContext(session, subscription),
    } satisfies CheckoutSessionDetails);
  }),

  http.post('/api/checkout/sessions/:id/complete', ({ params }) => {
    const completed = completeCheckoutSession(String(params.id));
    if (!completed) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const policySub = completed.subscriptionId
      ? subscriptions.all().find((row) => row.id === completed.subscriptionId)
      : subscriptions.all().find((row) => row.productType === 'policy' && row.status === 'active');
    const document = completed.documentId
      ? documents.all().find((row) => row.id === completed.documentId)
      : undefined;

    const createdContractIds =
      completed.euRepContractIds ?? (completed.euRepContractId ? [completed.euRepContractId] : []);
    const needsPolicyLinking = false;

    return HttpResponse.json({
      sessionId: completed.id,
      orderId: completed.orderId,
      subscriptionId: completed.subscriptionId,
      document: document ? presentDocument(document) : undefined,
      activeSubscriptionCount: countActivePolicySubscriptions(subscriptions.all()),
      nextPaymentDate: policySub?.nextPaymentDate ?? null,
      discountRate: completed.discountRate > 0 ? completed.discountRate : undefined,
      discountAmount: completed.discountAmount > 0 ? completed.discountAmount : undefined,
      needsPolicyLinking,
      euRepContractId: createdContractIds[0],
      euRepContractIds: createdContractIds,
    });
  }),

  http.get('/api/checkout/payrexx-portal', () =>
    HttpResponse.json({
      url: 'https://checkout.payrexx.com/portal/mock-datenschutzpartner',
    })
  ),

  http.get('/api/billing/orders/:id/invoice', ({ params }) => {
    const order = orders.all().find((row) => row.id === String(params.id));
    if (!order) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      url: `/api/billing/orders/${order.id}/invoice.pdf`,
      filename: `${order.number}.pdf`,
    });
  }),

  http.get('/api/billing/orders/:id/invoice.pdf', ({ params }) => {
    const order = orders.all().find((row) => row.id === String(params.id));
    if (!order) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = `Mock invoice ${order.number} — ${order.total} ${order.currency}`;
    return new HttpResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${order.number}.pdf"`,
      },
    });
  }),
];
