import type { AcademyUpcomingEvent } from './types';

/** Upcoming Academy sessions — synced with datenschutzpartner.ch/academy preview. */
export const ACADEMY_UPCOMING_PREVIEW: AcademyUpcomingEvent[] = [
  { type: 'webinar', liveAt: '2026-07-07T16:00:00+02:00', slug: 'ki-dienste-schweiz' },
  { type: 'newsQuestions', liveAt: '2026-07-21T11:00:00+02:00', titleKey: 'newsQuestionsDefault' },
  { type: 'webinar', liveAt: '2026-08-18T16:00:00+02:00' },
  { type: 'newsQuestions', liveAt: '2026-09-01T11:00:00+02:00', titleKey: 'newsQuestionsDefault' },
  { type: 'webinar', liveAt: '2026-10-06T16:00:00+02:00' },
  { type: 'newsQuestions', liveAt: '2026-10-20T11:00:00+02:00', titleKey: 'newsQuestionsDefault' },
  { type: 'webinar', liveAt: '2026-11-03T16:00:00+02:00' },
  { type: 'newsQuestions', liveAt: '2026-11-17T11:00:00+02:00', titleKey: 'newsQuestionsDefault' },
];

export const ACADEMY_PREVIEW_WEBINARS_LIMIT = 3;
export const ACADEMY_PREVIEW_NEWS_LIMIT = 3;

/** Max upcoming compact rows in the account Academy sessions tab (featured next live is separate). */
export const ACCOUNT_UPCOMING_LIMIT = 3;

/** Minimum past sessions shown when Coming up is empty. */
export const ACADEMY_PAST_SESSIONS_MIN_WHEN_COMING_UP_EMPTY = 10;

/**
 * Full past sessions archive (newest first) — synced with datenschutzpartner.ch/academy.
 * Webinars and News & Questions interleaved by live date.
 */
export const ACADEMY_PAST_SESSION_ENTRIES = [
  { type: 'newsQuestions' as const, slug: 'news-2026-06-02' },
  { type: 'webinar' as const, slug: 'ai-act-transparenz' },
  { type: 'newsQuestions' as const, slug: 'news-2026-05-05' },
  { type: 'webinar' as const, slug: 'ki-alternative-dienste' },
  { type: 'newsQuestions' as const, slug: 'news-2026-04-07' },
  { type: 'webinar' as const, slug: 'claude-anthropic' },
  { type: 'newsQuestions' as const, slug: 'news-2026-02-24' },
  { type: 'webinar' as const, slug: 'ki-daten-nutzung' },
  { type: 'newsQuestions' as const, slug: 'news-2026-01-27' },
  { type: 'webinar' as const, slug: 'edoeb-cookies' },
  { type: 'newsQuestions' as const, slug: 'news-2025-12-09' },
  { type: 'webinar' as const, slug: 'datenschutzberater' },
  { type: 'webinar' as const, slug: 'nis-2' },
  { type: 'webinar' as const, slug: 'impressum-checkliste' },
  { type: 'webinar' as const, slug: 'loeschbegehren' },
  { type: 'webinar' as const, slug: 'ai-act-pflichten' },
  { type: 'webinar' as const, slug: 'video-hinweisschild' },
] as const;

/** @deprecated Use ACADEMY_PAST_SESSION_ENTRIES */
export const ACADEMY_ON_DEMAND_PREVIEW = ACADEMY_PAST_SESSION_ENTRIES;

/** Slugs of past webinars shown in the academy preview (newest first). */
export const ACADEMY_PREVIEW_WEBINAR_SLUGS = [
  'ai-act-transparenz',
  'ki-alternative-dienste',
  'claude-anthropic',
  'ki-daten-nutzung',
  'edoeb-cookies',
  'datenschutzberater',
] as const;

/** Slugs of past News & Questions shown in the academy preview (newest first). */
export const ACADEMY_PREVIEW_NEWS_SLUGS = [
  'news-2026-06-02',
  'news-2026-05-05',
  'news-2026-04-07',
  'news-2026-02-24',
  'news-2026-01-27',
  'news-2025-12-09',
] as const;
