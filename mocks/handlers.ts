import { http, HttpResponse } from 'msw';
import type { Contact, ContactCreate } from '@/api/contacts';
import type { ContactMessage, ContactMessageCreate } from '@/api/contact-messages';
import type {
  AccountRole,
  ForgotPasswordInput,
  LoginIdentifyInput,
  LoginInput,
  RegisterInput,
  Session,
  VerifyEmailInput,
} from '@/api/auth';
import type { BillingAddress, AccountSnapshot, PasswordChange, Profile } from '@/api/account';
import type {
  Order,
  Subscription,
  SubscriptionBillingUpdate,
  EuRepExtraRequestCreate,
} from '@/api/billing';
import {
  countActivePolicySites,
  countActivePolicySubscriptions,
  isPolicySubscriptionOnTrial,
} from '@/api/billing';
import type { CheckoutSessionCreate, EuRepPlanId } from '@/api/checkout';
import {
  calculateEuRepQuote,
  calculateGeneratorPolicyQuote,
  EU_REP_EXTRA_REQUEST_PRICE,
  POLICY_TRIAL_DAYS,
  qualifyingSiteCountForCheckout,
  resolveEuRepPlan,
} from '@/api/checkout';
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
const MOCK_MEMBER_PASSWORD = 'dspmp';
const MOCK_DEMO_EMAIL = 'demo@datenschutzpartner.ch';
const MOCK_DEMO_PASSWORD = 'demo';
const MOCK_TWO_FACTOR_CODE = '123456';
/** Default password for accounts created after email verification in the prototype. */
const PROTOTYPE_REGISTERED_PASSWORD = 'welcome';

type AuthAccountRecord = {
  id: string;
  email: string;
  password: string;
  role: AccountRole;
};

const authAccounts = createCollection<AuthAccountRecord>(
  'auth-accounts',
  [
    {
      id: '1',
      email: MOCK_MEMBER_EMAIL,
      password: MOCK_MEMBER_PASSWORD,
      role: 'member',
    },
    {
      id: '2',
      email: MOCK_DEMO_EMAIL,
      password: MOCK_DEMO_PASSWORD,
      role: 'admin',
    },
  ],
  1
);

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
  });
}

function loginTokenForEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized === MOCK_MEMBER_EMAIL) return 'mock-member-token';
  if (normalized === MOCK_DEMO_EMAIL) return 'mock-token';
  return `mock-email-${encodeURIComponent(normalized)}`;
}

function emailFromLoginToken(token: string | null): string | null {
  if (!token) return null;
  if (token === 'mock-member-token') return MOCK_MEMBER_EMAIL;
  if (token === 'mock-token') return MOCK_DEMO_EMAIL;
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

const billingAddress = createCollection<BillingAddress & { id: string }>(
  'account-billing-address',
  [
    {
      id: '1',
      firstName: 'Lucas',
      lastName: 'Baumgartner',
      company: 'Baumgartner Digital AG',
      line1: 'Bahnhofstrasse 12',
      postalCode: '8001',
      city: 'Zürich',
      country: 'Schweiz',
      vatId: 'CHE-123.456.789 MWST',
      billingEmail: MOCK_MEMBER_EMAIL,
    },
  ],
  1
);

const profile = createCollection<Profile & { id: string }>(
  'account-profile',
  [
    {
      id: '1',
      firstName: 'Lucas',
      lastName: 'Baumgartner',
      displayName: 'Lucas Baumgartner',
      email: MOCK_MEMBER_EMAIL,
      role: 'member',
    },
  ],
  2
);

/** Billing-system numbers. Parent subscriptions keep a stable id; each invoice gets its own. */
const EU_REP_BAUMGARTNER_SUBSCRIPTION_ID = '56218';
const EU_REP_ALPENBLICK_SUBSCRIPTION_ID = '57391';
const EU_REP_BERGHOTEL_SUBSCRIPTION_ID = '58402';
/** Agency prepaid volume (buy-more) — atypical; most members have siteCount 1. */
const POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID = '84729';
const POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID = '86104';
const POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID = '87215';
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
      usedRequests: 0,
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
      product: 'EU Representation — Basis',
      planId: 'basis',
      legalEntityCount: 1,
      includedRequests: 0,
      usedRequests: 0,
      status: 'active',
      startDate: '2026-05-18',
      lastOrderDate: '2026-05-18',
      nextPaymentDate: '2027-05-18',
      billingAddressId: '1',
      totals: {
        product: 'EU Representation — Basis (12 Monate)',
        subtotal: 149,
        discount: 0,
        total: 149,
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
      status: 'active',
      startDate: '2026-06-01',
      lastOrderDate: '2026-06-01',
      nextPaymentDate: '2027-06-01',
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
        discount: 0,
        total: 445,
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
  19
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
};

const checkoutSessions = createCollection<CheckoutSessionRecord>('checkout-sessions', [], 3);

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

const pendingRegistrations = createCollection<PendingRegistration>('pending-registrations', [], 3);
const pendingCheckouts = createCollection<PendingCheckoutRecord>('pending-checkouts', [], 3);

function addOneYear(isoDate: string): string {
  const date = new Date(isoDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
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
  extraLinkedDocumentIds: string[] = [],
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
      postalLine1: details?.postalLine1?.trim() || defaults.postalLine1,
      postalLine2: details?.postalLine2?.trim() || undefined,
      postalCode: details?.postalCode?.trim() || defaults.postalCode,
      city: details?.city?.trim() || defaults.city,
      country: details?.country?.trim() || defaults.country,
      linkedDocumentIds: [],
      status: 'active',
    });
    contractIds.push(created.id);
    firstContractId ??= created.id;
  }

  if (firstContractId && extraLinkedDocumentIds.length > 0) {
    linkDocumentsToContract(firstContractId, extraLinkedDocumentIds, today);
  }

  return {
    orderId: euOrder?.id ?? '',
    subscriptionId,
    contractId: firstContractId,
    contractIds,
  };
}

function linkDocumentsToContract(contractId: string, documentIds: string[], today: string) {
  const contract = euRepContracts.all().find((row) => row.id === contractId);
  if (!contract) return;

  const linked = new Set(contract.linkedDocumentIds);
  for (const id of documentIds) {
    for (const other of euRepContracts.all()) {
      if (other.id === contractId || !other.linkedDocumentIds.includes(id)) continue;
      euRepContracts.update(other.id, {
        linkedDocumentIds: other.linkedDocumentIds.filter((item) => item !== id),
      });
    }
    linked.add(id);
    documents.update(id, { euRepContractId: contractId, euRepLinked: true, updatedDate: today });
  }

  euRepContracts.update(contractId, { linkedDocumentIds: [...linked] });
}

function unlinkDocumentFromContract(contractId: string, documentId: string, today: string) {
  const contract = euRepContracts.all().find((row) => row.id === contractId);
  if (!contract) return;

  documents.update(documentId, {
    euRepContractId: undefined,
    euRepLinked: false,
    updatedDate: today,
  });
  euRepContracts.update(contractId, {
    linkedDocumentIds: contract.linkedDocumentIds.filter((id) => id !== documentId),
  });
}

function stripEuRepFromHostedPolicies(subscriptionId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const contracts = euRepContracts
    .all()
    .filter((row) => row.subscriptionId === subscriptionId && row.status === 'active');

  for (const contract of contracts) {
    for (const id of contract.linkedDocumentIds) {
      documents.update(id, { euRepContractId: undefined, euRepLinked: false, updatedDate: today });
    }
    euRepContracts.update(contract.id, { status: 'cancelled', linkedDocumentIds: [] });
  }
}

function completeCheckoutSession(sessionId: string): CheckoutSessionRecord | undefined {
  const session = checkoutSessions.all().find((row) => row.id === sessionId);
  if (!session || session.status === 'completed') {
    return undefined;
  }

  const today = new Date().toISOString().slice(0, 10);

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
      euRepLinked: willBuyEuRep || willLinkExisting,
    });

    let euRepOrderId = '';
    if (willBuyEuRep) {
      const euResult = createEuRepPurchase(session, today, [created.id]);
      euRepOrderId = euResult?.orderId ?? '';
    } else if (willLinkExisting && session.euRepLinkContractId) {
      linkDocumentsToContract(session.euRepLinkContractId, [created.id], today);
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
      euRepLinked: willBuyEuRep || willLinkExisting,
    });
    documentId = created.id;
  }

  if (willBuyEuRep) {
    createEuRepPurchase(session, today, documentId ? [documentId] : []);
  } else if (willLinkExisting && session.euRepLinkContractId && documentId) {
    linkDocumentsToContract(session.euRepLinkContractId, [documentId], today);
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
      euRepLinked: willLinkExisting,
    });

    if (willLinkExisting && input.euRepLinkContractId) {
      linkDocumentsToContract(input.euRepLinkContractId, [created.id], today);
    }

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
        euRepPlanId: 'basis' as const,
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
    euRepLinked: willLinkExisting,
  });

  if (willLinkExisting && input.euRepLinkContractId) {
    linkDocumentsToContract(input.euRepLinkContractId, [created.id], today);
  }

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
        euRepPlanId: 'basis',
        euRepEntityCount: input.euRepEntityCount ?? 1,
        euRepEntities: input.euRepEntities,
      },
      today,
      [created.id],
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
    euRepPlanId: willBuyEuRep ? ('basis' as const) : undefined,
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
      total: 445,
      currency: 'CHF',
      siteCount: 5,
      orderKind: 'subscription',
      subscriptionId: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
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
      total: 149,
      currency: 'CHF',
      legalEntityCount: 1,
      planId: 'basis',
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
  16
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
        euRepContractId: '1',
        euRepLinked: true,
      },
      {
        id: '3',
        name: 'Privacy Policy',
        site: 'alpenblick-hotel.ch',
        legalEntity: 'Alpenblick Hospitality AG',
        subscriptionId: POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID,
        createdDate: '2025-09-20',
        updatedDate: '2026-05-20',
        euRepContractId: '2',
        euRepLinked: true,
      },
      {
        id: '6',
        name: 'Privacy Policy',
        site: 'mueller-consulting.ch',
        legalEntity: 'Müller Consulting GmbH',
        subscriptionId: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
        createdDate: '2026-01-22',
        updatedDate: '2026-04-02',
        euRepContractId: '1',
        euRepLinked: true,
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
  21
);

function findDocumentBySite(site: string): GeneratedDocument | undefined {
  const normalized = formatSiteDomain(site);
  return documents.all().find((doc) => formatSiteDomain(resolveDocumentSite(doc)) === normalized);
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

  return {
    needed: true as const,
    trialEndsAt: subscription.trialEndsAt,
    domain: resolveDocumentSite(doc),
    legalEntity: doc.legalEntity ?? pending?.legalEntity,
    fillSubscriptionId: pending?.fillSubscriptionId,
    documentId: doc.id,
    subscriptionId: doc.subscriptionId,
    euRepEntityCount: pending?.euRepEntityCount,
    euRepEntities: pending?.euRepEntities,
    euRepLinkContractId: pending?.euRepLinkContractId,
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
      postalLine1: 'Bahnhofstrasse 12',
      postalCode: '8001',
      city: 'Zürich',
      country: 'Schweiz',
      linkedDocumentIds: ['1', '6'],
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
      linkedDocumentIds: ['3'],
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
  6
);

const SWISS_LEGAL_ENTITY_BY_SITE: Record<string, string> = {
  'sutter-web.ch': 'Baumgartner Digital AG',
  'alpenblick-hotel.ch': 'Alpenblick Hospitality AG',
  'mueller-consulting.ch': 'Baumgartner Digital AG',
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

  const fromContract = euRepContracts
    .all()
    .find((row) => row.id === normalized.euRepContractId)?.legalEntity;
  const legalEntity = SWISS_LEGAL_ENTITY_BY_SITE[resolveDocumentSite(normalized)] ?? fromContract;
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

  http.post('/api/auth/login/identify', async ({ request }) => {
    const input = (await request.json()) as LoginIdentifyInput;
    const email = input.email.trim().toLowerCase();
    const role = accountRole(email);

    if (!role) {
      return HttpResponse.json({ message: 'unknown_email' }, { status: 404 });
    }

    return HttpResponse.json({ role });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const input = (await request.json()) as LoginInput;
    const email = input.email.trim().toLowerCase();
    const account = findAuthAccountByEmail(email);

    if (!account || input.password !== account.password) {
      return HttpResponse.json({ message: 'invalid_credentials' }, { status: 401 });
    }

    if (account.role === 'admin') {
      if (!input.twoFactorCode || input.twoFactorCode !== MOCK_TWO_FACTOR_CODE) {
        return HttpResponse.json({ message: 'invalid_two_factor' }, { status: 401 });
      }
    }

    return HttpResponse.json({ token: loginTokenForEmail(email), email });
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

    return HttpResponse.json({
      email,
      emailVerified: true,
      role: accountRole(email) ?? 'member',
    } satisfies Session);
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const input = (await request.json()) as RegisterInput;
    if (!input.email || !input.acceptTerms || !input.domain) {
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

    const trial = startPolicyTrial({
      kind: 'generator',
      siteCount: 1,
      domain: pending.domain,
      policyName: pending.policyName,
      legalEntity: pending.legalEntity,
      fillSubscriptionId: pending.fillSubscriptionId,
      euRepEntityCount: pending.euRepEntityCount,
      euRepEntities: pending.euRepEntities,
      euRepLinkContractId: pending.euRepLinkContractId,
    });

    const email = pending.email.trim().toLowerCase();
    ensureAuthAccount(email, 'member');

    return HttpResponse.json({
      token: loginTokenForEmail(email),
      email,
      documentId: trial?.documentId,
      domain: pending.domain,
      prototypePassword: PROTOTYPE_REGISTERED_PASSWORD,
    });
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    const input = (await request.json()) as ForgotPasswordInput;
    if (!input.email) {
      return HttpResponse.json({ message: 'invalid_email' }, { status: 400 });
    }
    return HttpResponse.json({ sent: true as const });
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
    const stored = profile.all()[0];
    const token = tokenFromRequest(request);
    const email = emailFromLoginToken(token) ?? stored?.email ?? MOCK_MEMBER_EMAIL;
    const resolvedEmail = stored?.email ?? email;
    const role = accountRole(resolvedEmail) ?? 'member';
    return HttpResponse.json({
      firstName: stored?.firstName ?? '',
      lastName: stored?.lastName ?? '',
      displayName: stored?.displayName ?? '',
      email: resolvedEmail,
      role,
      twoFactorEnabled: role === 'admin',
    } satisfies Profile);
  }),

  http.put('/api/account/profile', async ({ request }) => {
    const input = (await request.json()) as Profile;
    const existing = profile.all()[0];
    const email = input.email.trim().toLowerCase();
    const role = accountRole(email) ?? 'member';
    const payload: Profile = {
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName,
      email,
      newsletterOptIn: input.newsletterOptIn,
      role,
      twoFactorEnabled: role === 'admin',
    };
    const saved = existing
      ? profile.update(existing.id, payload)
      : profile.create({ ...payload, id: '1' });
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
    const updated = subscriptions.update(String(params.id), { status: 'cancelled' });
    if (updated?.productType === 'euRep') {
      stripEuRepFromHostedPolicies(updated.id);
    }
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.post('/api/billing/subscriptions/:id/continue', ({ params }) => {
    const updated = subscriptions.update(String(params.id), { status: 'active' });
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
    const subscription = subscriptions
      .all()
      .find((row) => row.id === input.subscriptionId && row.productType === 'euRep');
    if (!subscription || subscription.status !== 'active') {
      return HttpResponse.json({ message: 'Subscription not found' }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const order = orders.create({
      productType: 'euRep',
      number: nextOrderNumber(),
      date: today,
      status: 'active',
      total: EU_REP_EXTRA_REQUEST_PRICE,
      currency: 'CHF',
      planId: subscription.planId,
      orderKind: 'extraRequest',
      subscriptionId: subscription.id,
    });

    subscriptions.update(subscription.id, {
      usedRequests: (subscription.usedRequests ?? 0) + 1,
      lastOrderDate: today,
      relatedOrderIds: [...subscription.relatedOrderIds, order.id],
    });

    return HttpResponse.json(order, { status: 201 });
  }),

  http.get('/api/documents', () => HttpResponse.json(listHostedPolicies())),

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

  http.post('/api/eu-rep/contracts/:id/documents', async ({ params, request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const contract = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!contract || contract.status !== 'active') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const input = (await request.json()) as EuRepLinkDocuments;
    const today = new Date().toISOString().slice(0, 10);
    linkDocumentsToContract(contract.id, input.documentIds, today);
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
    const documentId = String(params.documentId);
    if (!contract.linkedDocumentIds.includes(documentId)) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const today = new Date().toISOString().slice(0, 10);
    unlinkDocumentFromContract(contract.id, documentId, today);
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
    const trial = startPolicyTrial(input);
    if (!trial) {
      return HttpResponse.json({ message: 'trial_failed' }, { status: 400 });
    }
    return HttpResponse.json(trial, { status: 201 });
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
          today,
          pending.documentId ? [pending.documentId] : []
        );
      }
    } else if (pending.euRepLinkContractId && pending.documentId) {
      linkDocumentsToContract(pending.euRepLinkContractId, [pending.documentId], today);
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

    if (input.kind === 'euRep') {
      const entityCount = Math.max(1, input.euRepEntityCount ?? input.euRepEntities?.length ?? 1);
      const planId = input.euRepPlanId ?? 'basis';
      const quote = calculateEuRepQuote(planId, entityCount);
      const session = checkoutSessions.create({
        status: 'pending',
        kind: input.kind,
        siteCount: entityCount,
        amount: quote.amountDue,
        generatorAmount: 0,
        listPrice: quote.amountDue,
        discountRate: 0,
        discountAmount: 0,
        currency: 'CHF',
        euRepPlanId: planId,
        euRepEntityCount: entityCount,
        euRepEntities: input.euRepEntities,
      });

      return HttpResponse.json(
        {
          id: session.id,
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
    const unlinkedHosted = documents
      .all()
      .filter((row) => !row.euRepContractId && !row.euRepLinked);
    const needsPolicyLinking =
      completed.kind === 'euRep' && createdContractIds.length > 0 && unlinkedHosted.length > 0;

    return HttpResponse.json({
      sessionId: completed.id,
      orderId: completed.orderId,
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
