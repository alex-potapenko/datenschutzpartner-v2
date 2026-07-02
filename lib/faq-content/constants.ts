export const ACADEMY_FAQ_ITEM_IDS = [
  'q1',
  'q2',
  'q3',
  'q4',
  'q5',
  'q6',
  'q7',
  'q8',
  'q9',
  'q10',
  'q11',
  'q12',
  'q13',
  'q14',
  'q15',
] as const;

export type AcademyFaqItemId = (typeof ACADEMY_FAQ_ITEM_IDS)[number];

export const ACADEMY_FAQ_CATEGORY_IDS = ['offer', 'access', 'participation', 'membership'] as const;

export type AcademyFaqCategoryId = (typeof ACADEMY_FAQ_CATEGORY_IDS)[number];

export const ACADEMY_FAQ_ITEMS_BY_CATEGORY: Record<
  AcademyFaqCategoryId,
  readonly AcademyFaqItemId[]
> = {
  offer: ['q1', 'q2', 'q3', 'q5', 'q6'],
  access: ['q4', 'q10', 'q11'],
  participation: ['q7', 'q8', 'q9'],
  membership: ['q12', 'q13', 'q14', 'q15'],
};

export const EU_REP_FAQ_CATEGORY_IDS = [
  'gdprGeneral',
  'gdprSwitzerland',
  'euRepresentation',
] as const;

export type EuRepFaqCategoryId = (typeof EU_REP_FAQ_CATEGORY_IDS)[number];

export const EU_REP_FAQ_ITEMS_BY_CATEGORY: Record<EuRepFaqCategoryId, readonly string[]> = {
  gdprGeneral: ['q1', 'q2', 'q3'],
  gdprSwitzerland: ['q4', 'q5', 'q6'],
  euRepresentation: ['q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16'],
};
