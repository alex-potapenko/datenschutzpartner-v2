import type { Locale } from '@/i18n/config';
import { INSIGHTS_CONTENT as deContent } from './de';
import { INSIGHTS_CONTENT as enContent } from './en';
import {
  LIVE_SESSION_DURATION_MINUTES,
  NEWS_QUESTIONS_SCHEDULE,
  WEBINAR_SCHEDULE,
} from './webinar-schedule';
import type { InsightArticle, InsightsTab, RawInsightArticle } from './types';
import { INSIGHTS_PAGE_SIZE, INSIGHTS_TAB_IDS } from './types';

export {
  HOMEPAGE_INSIGHTS_LIMIT,
  INSIGHTS_PAGE_SIZE,
  INSIGHTS_TAB_IDS,
  type InsightArticle,
  type InsightsTab,
  type RawInsightArticle,
} from './types';

function slugFromImage(image: string): string {
  const match = image.match(/seed\/([^/]+)/);
  return match?.[1] ?? 'article';
}

function liveScheduleForTab(tab: InsightsTab): Record<string, string> | undefined {
  if (tab === 'webinars') {
    return WEBINAR_SCHEDULE;
  }
  if (tab === 'newsQuestions') {
    return NEWS_QUESTIONS_SCHEDULE;
  }
  return undefined;
}

function normalizeArticle(raw: RawInsightArticle, tab: InsightsTab): InsightArticle {
  const { slug: rawSlug, ...rest } = raw;
  const slug = rawSlug ?? slugFromImage(raw.image);
  const liveAt = liveScheduleForTab(tab)?.[slug];

  return {
    ...rest,
    slug,
    tab,
    ...(liveAt && {
      liveAt,
      liveAtDurationMinutes: LIVE_SESSION_DURATION_MINUTES,
    }),
  };
}

function normalizeContent(
  content: Record<InsightsTab, RawInsightArticle[]>
): Record<InsightsTab, InsightArticle[]> {
  return {
    webinars: content.webinars.map((article) => normalizeArticle(article, 'webinars')),
    newsQuestions: content.newsQuestions.map((article) =>
      normalizeArticle(article, 'newsQuestions')
    ),
    podcasts: content.podcasts.map((article) => normalizeArticle(article, 'podcasts')),
  };
}

const contentByLocale = {
  de: normalizeContent(deContent),
  en: normalizeContent(enContent),
} as const;

export function getInsightsContent(locale: Locale): Record<InsightsTab, InsightArticle[]> {
  return contentByLocale[locale === 'en' ? 'en' : 'de'];
}

export function getAllInsightArticles(locale: Locale): InsightArticle[] {
  const content = getInsightsContent(locale);
  return [...content.webinars, ...content.newsQuestions, ...content.podcasts];
}

export function getInsightArticleBySlug(locale: Locale, slug: string): InsightArticle | undefined {
  return getAllInsightArticles(locale).find((article) => article.slug === slug);
}

export function isLiveInsightTab(tab: InsightsTab): boolean {
  return tab === 'webinars' || tab === 'newsQuestions';
}

export function parseInsightsTab(value: string | null | undefined): InsightsTab | undefined {
  if (value === 'news') {
    return 'newsQuestions';
  }
  if (value && INSIGHTS_TAB_IDS.includes(value as InsightsTab)) {
    return value as InsightsTab;
  }
  return undefined;
}

export function parseInsightsPage(value: string | null | undefined): number {
  const page = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(page) && page >= 1 ? page : 1;
}

export function getInsightsPageCount(totalItems: number, pageSize = INSIGHTS_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function getInsightsPageArticles<T>(
  articles: T[],
  page: number,
  pageSize = INSIGHTS_PAGE_SIZE
): { articles: T[]; page: number; totalPages: number } {
  const totalPages = getInsightsPageCount(articles.length, pageSize);
  const safePage = Math.min(parseInsightsPage(String(page)), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    articles: articles.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  };
}

export function insightsListHref(tab?: InsightsTab, page?: number): string {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (page && page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/insights?${query}` : '/insights';
}

export function getAdjacentInsightArticles(
  locale: Locale,
  slug: string
): { previous?: InsightArticle; next?: InsightArticle } {
  const article = getInsightArticleBySlug(locale, slug);
  if (!article) {
    return {};
  }

  const articles = getInsightsContent(locale)[article.tab];
  const index = articles.findIndex((item) => item.slug === slug);
  if (index === -1) {
    return {};
  }

  return {
    previous: index > 0 ? articles[index - 1] : undefined,
    next: index < articles.length - 1 ? articles[index + 1] : undefined,
  };
}

export function getAllInsightSlugs(): string[] {
  const slugs = new Set<string>();
  for (const locale of ['de', 'en'] as const) {
    for (const article of getAllInsightArticles(locale)) {
      slugs.add(article.slug);
    }
  }
  return [...slugs];
}
