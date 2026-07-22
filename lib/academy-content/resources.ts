import type { AcademyMembershipFeatureKey } from './events';

export const ACADEMY_ACCOUNT_RESOURCE_IDS = [
  'impressumChecklist',
  'videoNoticeSign',
  'employeeDeclaration',
] as const;

export type AcademyAccountResourceId = (typeof ACADEMY_ACCOUNT_RESOURCE_IDS)[number];

export type AcademyAccountResource = {
  id: AcademyAccountResourceId;
  href: string;
  featureKey: Extract<AcademyMembershipFeatureKey, 'checklists' | 'employeeDeclaration'>;
};

/** Static member resources — aligned with `ACADEMY_MEMBERSHIP_FEATURE_GROUPS.tools`. */
export const ACADEMY_ACCOUNT_RESOURCES: ReadonlyArray<AcademyAccountResource> = [
  {
    id: 'impressumChecklist',
    href: '/insights/impressum-checkliste',
    featureKey: 'checklists',
  },
  {
    id: 'videoNoticeSign',
    href: '/insights/video-hinweisschild',
    featureKey: 'checklists',
  },
  {
    id: 'employeeDeclaration',
    href: '/scan',
    featureKey: 'employeeDeclaration',
  },
];
