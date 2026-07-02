import { getLocale, getTranslations } from 'next-intl/server';
import {
  getAcademyPastSessions,
  getAcademyPastSessionsMinWhenComingUpEmpty,
  getUpcomingAcademyCompactEvents,
  getUpcomingAcademyFeaturedEvent,
} from '@/lib/academy-content/events';
import type { Locale } from '@/i18n/config';
import { AcademyPreviewGrid } from './AcademyPreviewGrid';

export async function AcademyPreviewSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('academy.landing.preview');
  const tPast = await getTranslations('academy.pastSessions');
  const featured = getUpcomingAcademyFeaturedEvent(locale);
  const compact = getUpcomingAcademyCompactEvents(locale);
  const pastSessions = getAcademyPastSessions(locale);

  return (
    <AcademyPreviewGrid
      locale={locale}
      featured={featured}
      compact={compact}
      pastSessions={pastSessions}
      pastSessionsMinWhenComingUpEmpty={getAcademyPastSessionsMinWhenComingUpEmpty()}
      labels={{
        sectionTitle: t('sectionTitle'),
        comingUpTitle: t('comingUpTitle'),
        comingUpEmpty: t('comingUpEmpty'),
        onDemandTitle: t('onDemandTitle'),
        viewAllPastSessions: t('viewAllPastSessions'),
        tabsNavigation: tPast('tabsNavigation'),
        tabs: {
          all: tPast('tabs.all'),
          webinars: tPast('tabs.webinars'),
          newsQuestions: tPast('tabs.newsQuestions'),
        },
        nextLiveBadge: t('nextLiveBadge'),
        webinarBadge: t('webinarBadge'),
        newsQuestionsBadge: t('newsQuestionsBadge'),
        readMore: t('readMore'),
        tba: t('tba'),
      }}
    />
  );
}
