/** Europe/Zurich start times for live webinar articles (ISO 8601). */
export const WEBINAR_SCHEDULE: Record<string, string> = {
  'ki-dienste-schweiz': '2026-07-07T16:00:00+02:00',
  'ai-act-transparenz': '2026-05-19T16:00:00+02:00',
  'ki-alternative-dienste': '2026-04-21T16:00:00+02:00',
  'claude-anthropic': '2026-03-10T16:00:00+01:00',
  'ki-daten-nutzung': '2026-02-17T16:00:00+01:00',
  'edoeb-cookies': '2026-01-13T16:00:00+01:00',
  datenschutzberater: '2025-11-04T16:00:00+01:00',
  'nis-2': '2025-04-08T16:00:00+02:00',
  'impressum-checkliste': '2025-03-10T16:00:00+01:00',
  'video-hinweisschild': '2023-09-01T16:00:00+02:00',
  loeschbegehren: '2025-02-05T16:00:00+01:00',
  'ai-act-pflichten': '2025-01-14T16:00:00+01:00',
};

/** Europe/Zurich start times for News & Questions live sessions (ISO 8601). */
export const NEWS_QUESTIONS_SCHEDULE: Record<string, string> = {
  'news-2026-06-02': '2026-06-02T11:00:00+02:00',
  'news-2026-05-05': '2026-05-05T11:00:00+02:00',
  'news-2026-04-07': '2026-04-07T11:00:00+02:00',
  'news-2026-02-24': '2026-02-24T11:00:00+01:00',
  'news-2026-01-27': '2026-01-27T11:00:00+01:00',
  'news-2025-12-09': '2025-12-09T11:00:00+01:00',
  'news-2026-07-21': '2026-07-21T11:00:00+02:00',
  'news-2026-08-18': '2026-08-18T11:00:00+02:00',
};

export const LIVE_SESSION_DURATION_MINUTES = 60;

/** @deprecated Use LIVE_SESSION_DURATION_MINUTES */
export const WEBINAR_LIVE_DURATION_MINUTES = LIVE_SESSION_DURATION_MINUTES;
