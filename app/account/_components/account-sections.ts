import {
  House,
  FileText,
  GraduationCap,
  GlobeHemisphereEast,
  IdentificationCard,
} from '@/components/ui';

export const ACCOUNT_SECTION_IDS = [
  'dashboard',
  'generator',
  'euRep',
  'academy',
  'accountDetails',
] as const;

export type AccountSectionId = (typeof ACCOUNT_SECTION_IDS)[number];

type IconComponent = typeof House;

export const SECTION_ICON: Record<AccountSectionId, IconComponent> = {
  dashboard: House,
  generator: FileText,
  academy: GraduationCap,
  euRep: GlobeHemisphereEast,
  accountDetails: IdentificationCard,
};

export function isAccountSection(value: string | null): value is AccountSectionId {
  return value !== null && (ACCOUNT_SECTION_IDS as readonly string[]).includes(value);
}

/** Deep-link back to the generator policies list (not dashboard overview). */
export const GENERATOR_POLICIES_HREF = '/account?section=generator';

/** Deep-link to the EU Representation contracts list. */
export const EU_REP_ACCOUNT_HREF = '/account?section=euRep';

export function euRepContractDetailHref(id: string) {
  return `/account/eu-rep/contracts/${id}`;
}

export function subscriptionDetailHref(id: string) {
  return `/account/subscriptions/${id}`;
}

/** Open the generator wizard to fill a prepaid slot on an existing subscription. */
export function fillPolicySlotScanHref(subscriptionId: string) {
  return `/scan?fillSubscription=${encodeURIComponent(subscriptionId)}`;
}

export function policyDetailHref(documentId: string) {
  return `/account/policies/${documentId}`;
}

export const ACADEMY_ACCOUNT_HREF = '/account?section=academy';
