import type { Locale } from '@/i18n/config';
import { NEWSLETTER_ARTICLES_DE, NEWSLETTER_ARTICLES_EN } from './newsletter';
import { PODCAST_ARTICLES_DE, PODCAST_ARTICLES_EN } from './podcasts';
import { asUpdatesArticles } from './updates';
import {
  INSIGHTS_PAGE_SIZE,
  INSIGHTS_TAB_IDS,
  type InsightArticle,
  type InsightsTab,
  type RawInsightArticle,
} from './types';

export {
  HOMEPAGE_INSIGHTS_LIMIT,
  INSIGHTS_PAGE_SIZE,
  INSIGHTS_TAB_IDS,
  type InsightArticle,
  type InsightsTab,
  type RawInsightArticle,
} from './types';

function slugFromImage(): string {
  return 'article';
}

function normalizeArticle(raw: RawInsightArticle, tab: InsightsTab): InsightArticle {
  const { slug: rawSlug, ...rest } = raw;
  const slug = rawSlug ?? slugFromImage();

  return {
    ...rest,
    slug,
    tab,
  };
}

function normalizeContent(content: {
  updates: RawInsightArticle[];
  podcasts: RawInsightArticle[];
}): Record<InsightsTab, InsightArticle[]> {
  return {
    updates: content.updates.map((article) => normalizeArticle(article, 'updates')),
    podcasts: content.podcasts.map((article) => normalizeArticle(article, 'podcasts')),
    newsletter: [],
  };
}

const contentByLocale = {
  de: normalizeContent({
    updates: asUpdatesArticles(NEWSLETTER_ARTICLES_DE, 'Aktuelles'),
    podcasts: PODCAST_ARTICLES_DE,
  }),
  en: normalizeContent({
    updates: asUpdatesArticles(NEWSLETTER_ARTICLES_EN, 'Updates'),
    podcasts: PODCAST_ARTICLES_EN,
  }),
} as const;

export function getInsightsContent(locale: Locale): Record<InsightsTab, InsightArticle[]> {
  return contentByLocale[locale === 'en' ? 'en' : 'de'];
}

export function getAllInsightArticles(locale: Locale): InsightArticle[] {
  const content = getInsightsContent(locale);
  return [...content.updates, ...content.podcasts];
}

export function getInsightArticleBySlug(
  locale: Locale,
  slug: string,
  preferredTab?: InsightsTab
): InsightArticle | undefined {
  const content = getInsightsContent(locale);

  if (preferredTab) {
    const fromPreferred = content[preferredTab].find((article) => article.slug === slug);
    if (fromPreferred) {
      return fromPreferred;
    }
  }

  for (const tab of INSIGHTS_TAB_IDS) {
    const article = content[tab].find((item) => item.slug === slug);
    if (article) {
      return article;
    }
  }

  return undefined;
}

export function parseInsightsTab(value: string | null | undefined): InsightsTab | undefined {
  if (value === 'news' || value === 'newsQuestions') {
    return 'updates';
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
  if (tab) {
    params.set('tab', tab);
  }
  if (page && page > 1) {
    params.set('page', String(page));
  }
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

export function getAllInsightSlugs(tab?: InsightsTab): string[] {
  const slugs = new Set<string>();
  for (const locale of ['de', 'en'] as const) {
    for (const article of getAllInsightArticles(locale)) {
      if (!tab || article.tab === tab) {
        slugs.add(article.slug);
      }
    }
  }
  return [...slugs];
}
