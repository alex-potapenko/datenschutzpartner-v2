export const ACCOUNT_DETAILS_TAB_IDS = ['profile', 'paymentDetails'] as const;

export type AccountDetailsTab = (typeof ACCOUNT_DETAILS_TAB_IDS)[number];

export function isAccountDetailsTab(value: string | null): value is AccountDetailsTab {
  return value !== null && (ACCOUNT_DETAILS_TAB_IDS as readonly string[]).includes(value);
}
