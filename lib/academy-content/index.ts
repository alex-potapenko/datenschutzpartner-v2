import type { Locale } from '@/i18n/config';
import { getInsightsContent } from '@/lib/insights-content';
import type { AcademyArticle, AcademyTab } from './types';
import { ACADEMY_TAB_IDS } from './types';

export { ACADEMY_TAB_IDS, type AcademyArticle, type AcademyTab } from './types';

export function getAcademyContent(locale: Locale): Record<AcademyTab, AcademyArticle[]> {
  const insights = getInsightsContent(locale);

  return {
    webinars: insights.webinars as AcademyArticle[],
    newsQuestions: insights.newsQuestions as AcademyArticle[],
  };
}

export function getAllAcademyArticles(locale: Locale): AcademyArticle[] {
  const content = getAcademyContent(locale);
  return [...content.webinars, ...content.newsQuestions];
}

export function getAcademyArticleBySlug(locale: Locale, slug: string): AcademyArticle | undefined {
  return getAllAcademyArticles(locale).find((article) => article.slug === slug);
}

export function parseAcademyTab(value: string | null | undefined): AcademyTab | undefined {
  if (value && ACADEMY_TAB_IDS.includes(value as AcademyTab)) {
    return value as AcademyTab;
  }
  return undefined;
}

export function academyListHref(tab?: AcademyTab): string {
  return tab ? `/academy?tab=${tab}` : '/academy';
}

export function getAdjacentAcademyArticles(
  locale: Locale,
  slug: string
): { previous?: AcademyArticle; next?: AcademyArticle } {
  const article = getAcademyArticleBySlug(locale, slug);
  if (!article) {
    return {};
  }

  const articles = getAcademyContent(locale)[article.tab];
  const index = articles.findIndex((item) => item.slug === slug);
  if (index === -1) {
    return {};
  }

  return {
    previous: index > 0 ? articles[index - 1] : undefined,
    next: index < articles.length - 1 ? articles[index + 1] : undefined,
  };
}

export function getAllAcademySlugs(): string[] {
  const slugs = new Set<string>();
  for (const locale of ['de', 'en'] as const) {
    for (const article of getAllAcademyArticles(locale)) {
      slugs.add(article.slug);
    }
  }
  return [...slugs];
}
