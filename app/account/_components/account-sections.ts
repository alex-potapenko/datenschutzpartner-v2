import { Buildings, Cookie, FileText, House } from '@/components/ui';
import { fillPolicySlotWizardHref } from '@/lib/account-routes';

/** Site-scoped sections in the account sidebar (My Websites). */
export const WEBSITE_SECTION_IDS = [
  'overview',
  'privacyPolicy',
  'cookieBanner',
  'imprint',
] as const;

export type WebsiteSectionId = (typeof WEBSITE_SECTION_IDS)[number];

/** EU Representation section — only valid in `accountScope=euRep`. */
export const EU_REP_SECTION_ID = 'euRep' as const;

export type EuRepSectionId = typeof EU_REP_SECTION_ID;

export type AccountShellSectionId = WebsiteSectionId | EuRepSectionId;

/** @deprecated Use `WebsiteSectionId`. */
export type AccountSectionId = WebsiteSectionId;

/** @deprecated Use `WEBSITE_SECTION_IDS`. */
export const ACCOUNT_SECTION_IDS = WEBSITE_SECTION_IDS;

/** @deprecated Use `WEBSITE_SECTION_IDS`. */
export const SIDEBAR_SECTION_IDS = WEBSITE_SECTION_IDS;

export const COMING_SOON_SECTION_IDS = ['cookieBanner', 'imprint'] as const;

export type ComingSoonSectionId = (typeof COMING_SOON_SECTION_IDS)[number];

/** Sections scoped to the active website (not EU Rep contracts). */
export const WEBSITE_SCOPED_SECTION_IDS = [
  'overview',
  'privacyPolicy',
  'cookieBanner',
  'imprint',
] as const satisfies readonly WebsiteSectionId[];

export type WebsiteScopedSectionId = (typeof WEBSITE_SCOPED_SECTION_IDS)[number];

/** Top-bar account scope — independent of the active sidebar section. */
export const ACCOUNT_SCOPE_IDS = ['websites', 'euRep'] as const;

export type AccountScopeId = (typeof ACCOUNT_SCOPE_IDS)[number];

export function normalizeAccountScope(value: string | null): AccountScopeId {
  return value === 'euRep' ? 'euRep' : 'websites';
}

export function isEuRepAccountScope(scope: AccountScopeId): boolean {
  return scope === 'euRep';
}

export function isWebsiteScopedSection(value: WebsiteSectionId): value is WebsiteScopedSectionId {
  return (WEBSITE_SCOPED_SECTION_IDS as readonly string[]).includes(value);
}

export function isComingSoonSection(value: WebsiteSectionId): value is ComingSoonSectionId {
  return (COMING_SOON_SECTION_IDS as readonly string[]).includes(value);
}

type IconComponent = typeof FileText;

export const SECTION_ICON: Record<WebsiteSectionId, IconComponent> = {
  overview: House,
  privacyPolicy: FileText,
  cookieBanner: Cookie,
  imprint: Buildings,
};

/** Accent used for the service icon and selected sidebar state. */
export const SECTION_ACCENT: Record<WebsiteSectionId, string> = {
  overview: 'var(--accent)',
  privacyPolicy: 'var(--accent)',
  cookieBanner: 'var(--feature-yellow)',
  imprint: 'var(--feature-teal)',
};

const LEGACY_SECTION_ALIASES: Record<string, WebsiteSectionId> = {
  dashboard: 'overview',
  subscriptions: 'overview',
  academy: 'overview',
  generator: 'privacyPolicy',
  websites: 'privacyPolicy',
  documents: 'privacyPolicy',
  accountDetails: 'overview',
  allSubscriptions: 'overview',
};

export function isWebsiteSection(value: string | null): value is WebsiteSectionId {
  if (value === null) return false;
  if (value in LEGACY_SECTION_ALIASES) return false;
  return (WEBSITE_SECTION_IDS as readonly string[]).includes(value);
}

export function normalizeWebsiteSection(value: string | null): WebsiteSectionId {
  if (value === EU_REP_SECTION_ID) return 'overview';
  if (value && value in LEGACY_SECTION_ALIASES) {
    return LEGACY_SECTION_ALIASES[value] as WebsiteSectionId;
  }
  return isWebsiteSection(value) ? value : 'overview';
}

export function readAccountShellSection(
  sectionParam: string | null,
  accountScope: AccountScopeId
): AccountShellSectionId {
  if (isEuRepAccountScope(accountScope)) return EU_REP_SECTION_ID;
  return normalizeWebsiteSection(sectionParam);
}

/** @deprecated Use `normalizeWebsiteSection`. */
export function normalizeAccountSection(value: string | null): WebsiteSectionId {
  return normalizeWebsiteSection(value);
}

export {
  ACCOUNT_CHECKOUT_HREF,
  ACCOUNT_DETAILS_HREF,
  ADD_WEBSITE_WIZARD_HREF,
  ALL_SUBSCRIPTIONS_ACCOUNT_HREF,
  EU_REP_ACCOUNT_HREF,
  PRIVACY_POLICY_ACCOUNT_HREF,
  privacyPolicyAccountHref,
  SUBSCRIPTIONS_ACCOUNT_HREF,
  fillPolicySlotWizardHref,
} from '@/lib/account-routes';

export function euRepContractDetailHref(id: string) {
  return `/account/eu-rep/contracts/${id}`;
}

export function fillPolicySlotScanHref(subscriptionId: string) {
  return fillPolicySlotWizardHref(subscriptionId);
}
