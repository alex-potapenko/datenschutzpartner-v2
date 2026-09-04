export const ALL_SUBSCRIPTIONS_TAB_IDS = ['privacyPolicy', 'euRep'] as const;

export type AllSubscriptionsTab = (typeof ALL_SUBSCRIPTIONS_TAB_IDS)[number];

export function isAllSubscriptionsTab(value: string | null): value is AllSubscriptionsTab {
  return value !== null && (ALL_SUBSCRIPTIONS_TAB_IDS as readonly string[]).includes(value);
}
