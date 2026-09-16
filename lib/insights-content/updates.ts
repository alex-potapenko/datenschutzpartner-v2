import type { RawInsightArticle } from './types';

/** Same articles as newsletter, shown under the Updates tab (no subscription banner on detail). */
export function asUpdatesArticles(
  articles: readonly RawInsightArticle[],
  category: string
): RawInsightArticle[] {
  return articles.map((article) => ({
    ...article,
    category,
  }));
}
