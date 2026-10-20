export const AFFILIATE_ADMIN_TAB_IDS = [
  'applications',
  'affiliates',
  'referrals',
  'payouts',
  'settings',
] as const;

export type AffiliateAdminTab = (typeof AFFILIATE_ADMIN_TAB_IDS)[number];

export const AFFILIATE_ADMIN_DEFAULT_TAB: AffiliateAdminTab = 'applications';

export function parseAffiliateAdminTab(value: string | null): AffiliateAdminTab {
  return AFFILIATE_ADMIN_TAB_IDS.find((id) => id === value) ?? AFFILIATE_ADMIN_DEFAULT_TAB;
}
