import { Buildings, Cookie, FileText, GlobeHemisphereEast, House } from '@/components/ui';

/** Site-scoped sections in the account sidebar. */
export const WEBSITE_SECTION_IDS = [
  'overview',
  'privacyPolicy',
  'euRep',
  'cookieBanner',
  'imprint',
] as const;

export type WebsiteSectionId = (typeof WEBSITE_SECTION_IDS)[number];

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
  euRep: GlobeHemisphereEast,
  cookieBanner: Cookie,
  imprint: Buildings,
};

/** Accent used for the service icon and selected sidebar state. */
export const SECTION_ACCENT: Record<WebsiteSectionId, string> = {
  overview: 'var(--accent)',
  privacyPolicy: 'var(--feature-indigo)',
  euRep: 'var(--feature-fuchsia)',
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
  if (value && value in LEGACY_SECTION_ALIASES) {
    return LEGACY_SECTION_ALIASES[value] as WebsiteSectionId;
  }
  return isWebsiteSection(value) ? value : 'overview';
}

/** @deprecated Use `normalizeWebsiteSection`. */
export function normalizeAccountSection(value: string | null): WebsiteSectionId {
  return normalizeWebsiteSection(value);
}

export {
  ACCOUNT_CHECKOUT_HREF,
  ACCOUNT_DETAILS_HREF,
  ALL_SUBSCRIPTIONS_ACCOUNT_HREF,
  EU_REP_ACCOUNT_HREF,
  PRIVACY_POLICY_ACCOUNT_HREF,
  SUBSCRIPTIONS_ACCOUNT_HREF,
} from '@/lib/account-routes';

export function euRepContractDetailHref(id: string) {
  return `/account/eu-rep/contracts/${id}`;
}

export function subscriptionDetailHref(id: string) {
  return `/account/subscriptions/${id}`;
}

export function fillPolicySlotScanHref(subscriptionId: string) {
  return `/scan?fillSubscription=${encodeURIComponent(subscriptionId)}`;
}
