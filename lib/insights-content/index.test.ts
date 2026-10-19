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
      new Set(['updates', 'podcasts', 'newsletter'])
    );
    expect(getInsightsContent('en').newsletter.length).toBeGreaterThan(0);
    expect(getInsightsContent('en').updates.length).toBeGreaterThan(0);
  });

  it('keeps updates and newsletter mock corpora distinct', () => {
    const content = getInsightsContent('en');
    const updateSlugs = new Set(content.updates.map((article) => article.slug));
    const newsletterSlugs = new Set(content.newsletter.map((article) => article.slug));
    for (const slug of newsletterSlugs) {
      expect(updateSlugs.has(slug)).toBe(false);
    }
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

  it('resolves newsletter articles by slug and tab', () => {
    const article = getInsightsContent('en').newsletter[0];
    expect(article?.slug).toBeTruthy();
    if (!article) {
      return;
    }
    expect(getInsightArticleBySlug('en', article.slug, 'newsletter')?.tab).toBe('newsletter');
  });
});
