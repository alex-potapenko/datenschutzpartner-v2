'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui';
import { AcademyMembershipPromoBanner } from '@/components/shared/AcademyMembershipPromoBanner';
import {
  filterAcademyPastSessions,
  getAcademyPastSessions,
  type AcademyOnDemandItem,
} from '@/lib/academy-content/events';
import {
  parseAcademyPastSessionTab,
  type AcademyPastSessionTab,
} from '@/lib/academy-content/constants';
import type { Locale } from '@/i18n/config';
import type { AcademyPreviewListLabels } from './academy-preview-list';
import { AcademyPastSessionsByYear } from './AcademyPastSessionsByYear';
import {
  ACADEMY_PAST_SESSION_TAB_IDS,
  AcademySessionCategoryTabs,
} from './AcademySessionCategoryTabs';

function AcademyPastSessionsPanelContent() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tPage = useTranslations('academy.pastSessions');
  const tPreview = useTranslations('academy.landing.preview');
  const pastSessions = getAcademyPastSessions(locale);
  const activeTab = parseAcademyPastSessionTab(searchParams.get('tab')) ?? 'all';

  const labels: AcademyPreviewListLabels = {
    nextLiveBadge: tPreview('nextLiveBadge'),
    webinarBadge: tPreview('webinarBadge'),
    newsQuestionsBadge: tPreview('newsQuestionsBadge'),
    readMore: tPreview('readMore'),
    tba: tPreview('tba'),
  };

  const tabLabels: Record<AcademyPastSessionTab, string> = {
    all: tPage('tabs.all'),
    webinars: tPage('tabs.webinars'),
    newsQuestions: tPage('tabs.newsQuestions'),
  };

  const handleTabChange = (tab: AcademyPastSessionTab) => {
    const nextUrl = tab === 'all' ? pathname : `${pathname}?tab=${tab}`;
    router.replace(nextUrl, { scroll: false });
  };

  return (
    <>
      <div className="flex flex-col gap-8 px-4 pt-20 pb-8 sm:px-8">
        <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{tPage('title')}</h1>
      </div>

      <AcademySessionCategoryTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabsNavigationLabel={tPage('tabsNavigation')}
        tabLabels={tabLabels}
      >
        {ACADEMY_PAST_SESSION_TAB_IDS.map((tab) => (
          <Tabs.Panel key={tab} id={tab} className="!mt-0 !p-0">
            <PastSessionsList
              items={filterAcademyPastSessions(pastSessions, tab)}
              locale={locale}
              labels={labels}
              showTypeChip={tab === 'all'}
              sessionType={tab}
            />
          </Tabs.Panel>
        ))}
      </AcademySessionCategoryTabs>
    </>
  );
}

function PastSessionsList({
  items,
  locale,
  labels,
  showTypeChip = true,
  sessionType,
}: {
  items: AcademyOnDemandItem[];
  locale: Locale;
  labels: AcademyPreviewListLabels;
  showTypeChip?: boolean;
  sessionType: AcademyPastSessionTab;
}) {
  return (
    <div className="flex items-start">
      <div className="border-border min-w-0 flex-1 border-r p-4 sm:p-8">
        <AcademyPastSessionsByYear
          items={items}
          locale={locale}
          labels={labels}
          showTypeChip={showTypeChip}
        />
      </div>

      <aside className="sticky top-24 hidden w-[400px] shrink-0 p-8 lg:block">
        <AcademyMembershipPromoBanner variant="vertical" sessionType={sessionType} />
      </aside>
    </div>
  );
}

function AcademyPastSessionsPanelFallback() {
  const tPage = useTranslations('academy.pastSessions');

  return (
    <div className="flex flex-col gap-8 px-4 pt-20 pb-8 sm:px-8">
      <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{tPage('title')}</h1>
    </div>
  );
}

export function AcademyPastSessionsPanel() {
  return (
    <Suspense fallback={<AcademyPastSessionsPanelFallback />}>
      <AcademyPastSessionsPanelContent />
    </Suspense>
  );
}
