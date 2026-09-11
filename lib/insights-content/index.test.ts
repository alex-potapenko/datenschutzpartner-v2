import { describe, expect, it } from 'vitest';
import {
  getAllInsightArticles,
  getInsightsContent,
  insightsListHref,
  INSIGHTS_TAB_IDS,
} from './index';

describe('insights content', () => {
  it('contains only news and podcasts', () => {
    expect(INSIGHTS_TAB_IDS).toEqual(['news', 'podcasts']);
    expect(Object.keys(getInsightsContent('en'))).toEqual(['news', 'podcasts']);
    expect(new Set(getAllInsightArticles('en').map((article) => article.tab))).toEqual(
      new Set(['news', 'podcasts'])
    );
  });

  it('links article navigation back to its section', () => {
    expect(insightsListHref()).toBe('/insights');
    expect(insightsListHref('news')).toBe('/insights?tab=news');
    expect(insightsListHref('podcasts', 2)).toBe('/insights?tab=podcasts&page=2');
  });
});
