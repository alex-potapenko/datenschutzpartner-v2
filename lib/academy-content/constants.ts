export const ACADEMY_OVERVIEW_FEATURE_KEYS = ['compliance', 'sessions', 'resources'] as const;

/** Live membership checkout on datenschutzpartner.ch — Academy is a landing only in v2. */
export const ACADEMY_MEMBERSHIP_EXTERNAL_URL = 'https://www.datenschutzpartner.ch/academy/';

export type AcademyOverviewFeatureKey = (typeof ACADEMY_OVERVIEW_FEATURE_KEYS)[number];

export const ACADEMY_MEMBERSHIP_FEATURE_KEYS = [
  'webinarsLive',
  'webinarsRecordings',
  'newsLive',
  'newsRecordings',
  'legalSessions',
  'employeeDeclaration',
  'checklists',
  'newsletterBonus',
  'podcastBonus',
] as const;

export type AcademyMembershipFeatureKey = (typeof ACADEMY_MEMBERSHIP_FEATURE_KEYS)[number];
