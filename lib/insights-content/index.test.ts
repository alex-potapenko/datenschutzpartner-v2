import { describe, expect, it } from 'vitest';
import {
  getAllInsightArticles,
  getInsightArticleBySlug,
  getInsightsContent,
  insightsListHref,
  INSIGHTS_TAB_IDS,
  parseInsightsTab,
} from './index';

describe('insights content', () => {
  it('exposes updates, podcasts, and newsletter tabs', () => {
    expect(INSIGHTS_TAB_IDS).toEqual(['updates', 'podcasts', 'newsletter']);
    expect(Object.keys(getInsightsContent('en'))).toEqual(['updates', 'podcasts', 'newsletter']);
    expect(new Set(getAllInsightArticles('en').map((article) => article.tab))).toEqual(
      new Set(['updates', 'podcasts'])
    );
    expect(getInsightsContent('en').newsletter).toEqual([]);
    expect(getInsightsContent('en').updates.length).toBeGreaterThan(0);
  });

  it('links article navigation back to its section', () => {
    expect(insightsListHref()).toBe('/insights');
    expect(insightsListHref('newsletter')).toBe('/insights?tab=newsletter');
    expect(insightsListHref('podcasts', 2)).toBe('/insights?tab=podcasts&page=2');
  });

  it('maps legacy news tab to updates', () => {
    expect(parseInsightsTab('news')).toBe('updates');
  });

  it('resolves update articles by slug', () => {
    const article = getInsightsContent('en').updates[0];
    expect(article?.slug).toBeTruthy();
    if (!article) {
      return;
    }
    expect(getInsightArticleBySlug('en', article.slug)?.tab).toBe('updates');
  });
});
