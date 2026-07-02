import type { Locale } from '@/i18n/config';
import type { AcademyUpcomingTitleKey } from './types';

const TITLE_BY_KEY: Record<AcademyUpcomingTitleKey, Record<'de' | 'en', string>> = {
  newsQuestionsDefault: {
    de: 'Fragen und Neuigkeiten zum Datenschutzrecht',
    en: 'Questions and news on data protection law',
  },
};

export function resolveAcademyUpcomingTitleKey(
  key: AcademyUpcomingTitleKey,
  locale: Locale
): string {
  return TITLE_BY_KEY[key][locale === 'en' ? 'en' : 'de'];
}
