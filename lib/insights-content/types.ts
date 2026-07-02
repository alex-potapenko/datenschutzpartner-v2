export type InsightsTab = 'webinars' | 'newsQuestions' | 'podcasts';

export const INSIGHTS_TAB_IDS = [
  'webinars',
  'newsQuestions',
  'podcasts',
] as const satisfies readonly InsightsTab[];

export const HOMEPAGE_INSIGHTS_LIMIT = 3;
export const INSIGHTS_PAGE_SIZE = 6;

export type InsightArticle = {
  slug: string;
  tab: InsightsTab;
  category: string;
  date: string;
  title: string;
  description: string;
  readTime: string;
  image: string;
  author?: string;
  presenter?: string;
  /** ISO 8601 live start (webinars and News & Questions). */
  liveAt?: string;
  liveAtDurationMinutes?: number;
  externalUrl?: string;
  /** Podigee player configuration URL (podcast episodes only). */
  podigeeEmbedUrl?: string;
};

export type RawInsightArticle = Omit<InsightArticle, 'slug' | 'tab'> & { slug?: string };
