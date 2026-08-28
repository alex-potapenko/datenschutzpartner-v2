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
  'academy',
  'euRep',
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
export const GENERATOR_POLICIES_HREF = '/account?section=generator&tab=policies';
