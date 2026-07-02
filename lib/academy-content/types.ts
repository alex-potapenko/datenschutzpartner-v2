export type AcademyTab = 'webinars' | 'newsQuestions';

export const ACADEMY_TAB_IDS = [
  'webinars',
  'newsQuestions',
] as const satisfies readonly AcademyTab[];

export type AcademyArticle = {
  slug: string;
  tab: AcademyTab;
  category: string;
  date: string;
  title: string;
  description: string;
  readTime: string;
  image: string;
  author?: string;
  presenter?: string;
  /** ISO 8601 live start (webinars only). */
  liveAt?: string;
  liveAtDurationMinutes?: number;
};

export type AcademyUpcomingTitleKey = 'newsQuestionsDefault';

export type AcademyUpcomingEvent = {
  type: 'webinar' | 'newsQuestions';
  liveAt: string;
  title?: string;
  titleKey?: AcademyUpcomingTitleKey;
  slug?: string;
};
