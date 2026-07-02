import type { Locale } from '@/i18n/config';
import { getInsightsContent, type InsightArticle } from '@/lib/insights-content';
import {
  ACADEMY_PAST_SESSION_ENTRIES,
  ACADEMY_PAST_SESSIONS_MIN_WHEN_COMING_UP_EMPTY,
  ACADEMY_PREVIEW_NEWS_LIMIT,
  ACADEMY_PREVIEW_NEWS_SLUGS,
  ACADEMY_PREVIEW_WEBINARS_LIMIT,
  ACADEMY_PREVIEW_WEBINAR_SLUGS,
  ACADEMY_UPCOMING_PREVIEW,
} from './preview-schedule';
import type { AcademyPastSessionTab } from './constants';
import type { AcademyUpcomingEvent } from './types';
import { resolveAcademyUpcomingTitleKey } from './upcoming-titles';

export type { AcademyUpcomingEvent } from './types';

export type AcademyOnDemandItem = {
  type: 'webinar' | 'newsQuestions';
  slug: string;
  title: string;
  liveAt: string;
  image: string;
};

const LIVE_AT_TIMEZONE = 'Europe/Zurich';

const ACADEMY_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
] as const;

function academyFallbackImage(seed: string): string {
  const hash = Array.from(seed).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);
  const index = hash % ACADEMY_FALLBACK_IMAGES.length;

  return ACADEMY_FALLBACK_IMAGES[index] ?? ACADEMY_FALLBACK_IMAGES[0];
}

export function getAcademySessionFallbackImage(seed: string): string {
  return academyFallbackImage(seed);
}

function formatParts(iso: string, locale: Locale) {
  const intlLocale = locale === 'de' ? 'de-CH' : 'en-CH';

  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: 'short',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: locale === 'en',
    timeZone: LIVE_AT_TIMEZONE,
  }).formatToParts(new Date(iso));
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((entry) => entry.type === type)?.value ?? '';
}

export function formatAcademyDateBox(iso: string, locale: Locale): { day: string; month: string } {
  const parts = formatParts(iso, locale);

  return {
    day: part(parts, 'day'),
    month: part(parts, 'month').replace(/\.$/, '').toUpperCase(),
  };
}

export function formatAcademyFeaturedMeta(iso: string, locale: Locale): string {
  const parts = formatParts(iso, locale);
  const weekday = part(parts, 'weekday');
  const hour = part(parts, 'hour');
  const minute = part(parts, 'minute').padStart(2, '0');
  const dayPeriod = part(parts, 'dayPeriod');

  if (locale === 'de') {
    return `${weekday} · ${hour}.${minute} Uhr CET · Live-Q&A inklusive`;
  }

  const time =
    dayPeriod.length > 0 ? `${hour}:${minute} ${dayPeriod.toLowerCase()}` : `${hour}:${minute}`;

  return `${weekday} · ${time} CET · live Q&A included`;
}

export function formatAcademyCompactTime(iso: string, locale: Locale): string {
  const parts = formatParts(iso, locale);
  const hour = part(parts, 'hour');
  const minute = part(parts, 'minute').padStart(2, '0');
  const dayPeriod = part(parts, 'dayPeriod');

  if (locale === 'de') {
    return `${hour}.${minute} Uhr CET`;
  }

  const time =
    dayPeriod.length > 0 ? `${hour}:${minute} ${dayPeriod.toLowerCase()}` : `${hour}:${minute}`;

  return `${time} CET`;
}

export function formatAcademyCompactDate(iso: string, locale: Locale): string {
  const intlLocale = locale === 'de' ? 'de-CH' : 'en-CH';

  return new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    timeZone: LIVE_AT_TIMEZONE,
  }).format(new Date(iso));
}

export function formatAcademyEventDate(iso: string, locale: Locale): string {
  const intlLocale = locale === 'de' ? 'de-CH' : 'en-CH';
  const date = new Date(iso);

  if (locale === 'de') {
    const parts = new Intl.DateTimeFormat(intlLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: LIVE_AT_TIMEZONE,
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';

    const hour = get('hour');
    const minute = get('minute').padStart(2, '0');

    return `${get('day')}. ${get('month')} ${get('year')} um ${hour}.${minute} Uhr`;
  }

  return new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: LIVE_AT_TIMEZONE,
  }).format(date);
}

export function getUpcomingAcademyEvents(locale: Locale): AcademyUpcomingEvent[] {
  void locale;
  return ACADEMY_UPCOMING_PREVIEW;
}

export function getUpcomingAcademyFeaturedEvent(locale: Locale): AcademyUpcomingEvent | undefined {
  return getUpcomingAcademyEvents(locale)[0];
}

export function getUpcomingAcademyCompactEvents(locale: Locale): AcademyUpcomingEvent[] {
  return getUpcomingAcademyEvents(locale).slice(1);
}

export function resolveAcademyEventTitle(
  locale: Locale,
  event: AcademyUpcomingEvent
): string | undefined {
  if (event.title) {
    return event.title;
  }

  if (event.titleKey) {
    return resolveAcademyUpcomingTitleKey(event.titleKey, locale);
  }

  if (!event.slug) {
    return undefined;
  }

  const tab = event.type === 'webinar' ? 'webinars' : 'newsQuestions';
  return getInsightsContent(locale)[tab].find((article) => article.slug === event.slug)?.title;
}

export function resolveAcademyEventImage(
  locale: Locale,
  event: AcademyUpcomingEvent
): string | undefined {
  const fallbackImage = academyFallbackImage(`${event.type}-${event.liveAt}`);

  if (!event.slug) {
    return fallbackImage;
  }

  const tab = event.type === 'webinar' ? 'webinars' : 'newsQuestions';
  return (
    getInsightsContent(locale)[tab].find((article) => article.slug === event.slug)?.image ??
    fallbackImage
  );
}

export function getAcademyPastSessions(locale: Locale): AcademyOnDemandItem[] {
  const content = getInsightsContent(locale);

  return ACADEMY_PAST_SESSION_ENTRIES.flatMap((item) => {
    const tab = item.type === 'webinar' ? 'webinars' : 'newsQuestions';
    const article = content[tab].find((entry) => entry.slug === item.slug);

    if (!article?.liveAt) {
      return [];
    }

    return [
      {
        type: item.type,
        slug: item.slug,
        title: article.title,
        liveAt: article.liveAt,
        image: article.image,
      },
    ];
  });
}

/** @deprecated Use getAcademyPastSessions */
export function getAcademyOnDemandPreview(locale: Locale): AcademyOnDemandItem[] {
  return getAcademyPastSessions(locale);
}

export function getAcademyPastSessionsMinWhenComingUpEmpty(): number {
  return ACADEMY_PAST_SESSIONS_MIN_WHEN_COMING_UP_EMPTY;
}

export function filterAcademyPastSessions(
  items: AcademyOnDemandItem[],
  tab: AcademyPastSessionTab
): AcademyOnDemandItem[] {
  if (tab === 'all') {
    return items;
  }

  if (tab === 'webinars') {
    return items.filter((item) => item.type === 'webinar');
  }

  return items.filter((item) => item.type === 'newsQuestions');
}

export function academySessionMatchesTab(
  type: AcademyOnDemandItem['type'],
  tab: AcademyPastSessionTab
): boolean {
  if (tab === 'all') {
    return true;
  }

  if (tab === 'webinars') {
    return type === 'webinar';
  }

  return type === 'newsQuestions';
}

export function filterAcademyUpcomingEvents(
  events: AcademyUpcomingEvent[],
  tab: AcademyPastSessionTab
): AcademyUpcomingEvent[] {
  return events.filter((event) => academySessionMatchesTab(event.type, tab));
}

function articlesBySlugs(
  articles: InsightArticle[],
  slugs: readonly string[],
  limit: number
): InsightArticle[] {
  const bySlug = new Map(articles.map((article) => [article.slug, article]));

  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((article): article is InsightArticle => article !== undefined)
    .slice(0, limit);
}

export function getLatestAcademyArticles(
  locale: Locale,
  tab: 'webinars' | 'newsQuestions',
  limit: number
): InsightArticle[] {
  const content = getInsightsContent(locale)[tab];

  if (tab === 'webinars') {
    return articlesBySlugs(content, ACADEMY_PREVIEW_WEBINAR_SLUGS, limit);
  }

  return articlesBySlugs(content, ACADEMY_PREVIEW_NEWS_SLUGS, limit);
}

export function getAcademyPreviewWebinarsLimit(): number {
  return ACADEMY_PREVIEW_WEBINARS_LIMIT;
}

export function getAcademyPreviewNewsLimit(): number {
  return ACADEMY_PREVIEW_NEWS_LIMIT;
}

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
