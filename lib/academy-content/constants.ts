export const ACADEMY_OVERVIEW_FEATURE_KEYS = ['compliance', 'sessions', 'resources'] as const;

export type AcademyOverviewFeatureKey = (typeof ACADEMY_OVERVIEW_FEATURE_KEYS)[number];

export const ACADEMY_PAST_SESSION_TAB_IDS = ['all', 'webinars', 'newsQuestions'] as const;

export type AcademyPastSessionTab = (typeof ACADEMY_PAST_SESSION_TAB_IDS)[number];

export function parseAcademyPastSessionTab(
  value: string | null | undefined
): AcademyPastSessionTab | undefined {
  if (value && ACADEMY_PAST_SESSION_TAB_IDS.includes(value as AcademyPastSessionTab)) {
    return value as AcademyPastSessionTab;
  }

  return undefined;
}
