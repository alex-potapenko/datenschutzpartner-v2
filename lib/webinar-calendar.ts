import type { Locale } from '@/i18n/config';

const LIVE_AT_TIMEZONE = 'Europe/Zurich';

export function formatInsightLiveAt(iso: string, locale: Locale): string {
  const intlLocale = locale === 'de' ? 'de-CH' : 'en-CH';

  return new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: locale === 'en',
    timeZone: LIVE_AT_TIMEZONE,
  }).format(new Date(iso));
}

function toIcsUtcTimestamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeIcsValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export type WebinarCalendarEvent = {
  uid: string;
  title: string;
  description: string;
  liveAt: string;
  durationMinutes: number;
  url: string;
};

export function isUpcomingWebinar(liveAt: string, durationMinutes: number): boolean {
  const endMs = new Date(liveAt).getTime() + durationMinutes * 60_000;
  return endMs > Date.now();
}

export function buildWebinarIcs(event: WebinarCalendarEvent): string {
  const start = new Date(event.liveAt);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const now = toIcsUtcTimestamp(new Date().toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Datenschutzpartner//Insights Webinar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsValue(event.uid)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsUtcTimestamp(start.toISOString())}`,
    `DTEND:${toIcsUtcTimestamp(end.toISOString())}`,
    `SUMMARY:${escapeIcsValue(event.title)}`,
    `DESCRIPTION:${escapeIcsValue(`${event.description}\n\n${event.url}`)}`,
    `URL:${escapeIcsValue(event.url)}`,
    'LOCATION:Online — Datenschutz-Academy',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.join('\r\n')}\r\n`;
}

export function downloadWebinarCalendarEvent(event: WebinarCalendarEvent): void {
  const ics = buildWebinarIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${slugifyFilename(event.title) || 'webinar'}.ics`;
  link.click();
  URL.revokeObjectURL(objectUrl);
}
