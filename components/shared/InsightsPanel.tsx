'use client';

import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CaretRight, GraduationCap, MicrophoneStage, Newspaper, Tabs } from '@/components/ui';
import { ArticlesGrid } from './ArticlesGrid';
import { InsightsPagination } from './InsightsPagination';
import {
  getInsightsContent,
  getInsightsPageArticles,
  HOMEPAGE_INSIGHTS_LIMIT,
  INSIGHTS_TAB_IDS,
  parseInsightsPage,
  parseInsightsTab,
  type InsightsTab,
} from '@/lib/insights-content';
import type { Locale } from '@/i18n/config';

interface InsightsPanelProps {
  limit?: number;
  showAllLink?: boolean;
  heading?: 'h1' | 'h2';
  headerClassName?: string;
  panelClassName?: string;
}

const TAB_ICONS: Record<InsightsTab, ReactNode> = {
  webinars: <GraduationCap size={20} weight="fill" aria-hidden />,
  newsQuestions: <Newspaper size={20} weight="fill" aria-hidden />,
  podcasts: <MicrophoneStage size={20} weight="fill" aria-hidden />,
};

function InsightsPanelContent({
  limit,
  showAllLink = false,
  heading = 'h2',
  headerClassName = 'pt-16 pb-6 sm:pt-24 lg:pt-36',
  panelClassName,
}: InsightsPanelProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('insights');
  const activeTab = parseInsightsTab(searchParams.get('tab')) ?? 'webinars';
  const activePage = parseInsightsPage(searchParams.get('page'));
  const content = getInsightsContent(locale);
  const isPaginated = limit === undefined;

  const handleTabChange = (key: React.Key) => {
    const tab = key as InsightsTab;
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', activeTab);
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const HeadingTag = heading;
  const titleClassName = [
    'text-foreground font-bold',
    heading === 'h1' ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl lg:text-3xl',
  ].join(' ');

  return (
    <>
      <div className={['flex flex-col gap-8 px-4 sm:px-8', headerClassName].join(' ')}>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <HeadingTag className={titleClassName}>{t('title')}</HeadingTag>
          {showAllLink && (
            <Link
              href="/insights"
              className="inline-flex shrink-0 items-center gap-1 text-base font-normal transition-colors hover:text-[var(--link-hover)]"
              style={{ color: 'var(--accent)' }}
            >
              {t('allInsights')} <CaretRight size={16} />
            </Link>
          )}
        </div>
      </div>

      <Tabs
        variant="secondary"
        selectedKey={activeTab}
        onSelectionChange={handleTabChange}
        className="w-full gap-0"
      >
        <Tabs.ListContainer className="border-border overflow-x-auto border-b px-4 sm:px-8">
          <Tabs.List aria-label={t('tabsNavigation')} className="!w-auto max-w-full !border-b-0">
            {INSIGHTS_TAB_IDS.map((tab) => (
              <Tabs.Tab key={tab} id={tab} className="!h-auto !w-auto shrink-0 pb-4">
                <span className="font-display inline-flex items-center gap-2 text-sm whitespace-nowrap sm:text-base">
                  {TAB_ICONS[tab]}
                  {t(`tabs.${tab}`)}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        {INSIGHTS_TAB_IDS.map((tab) => {
          const tabArticles = content[tab];
          const { articles, page, totalPages } = isPaginated
            ? getInsightsPageArticles(tabArticles, activeTab === tab ? activePage : 1)
            : {
                articles: limit ? tabArticles.slice(0, limit) : tabArticles,
                page: 1,
                totalPages: 1,
              };

          return (
            <Tabs.Panel
              key={tab}
              id={tab}
              className={['!mt-0 p-0', panelClassName].filter(Boolean).join(' ')}
            >
              <ArticlesGrid
                articles={articles}
                basePath="/insights"
                layout={isPaginated && page > 1 ? 'uniform' : 'featured'}
              />
              {isPaginated && activeTab === tab && (
                <InsightsPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </>
  );
}

export function InsightsPanel(props: InsightsPanelProps) {
  return (
    <Suspense fallback={<InsightsPanelFallback {...props} />}>
      <InsightsPanelContent {...props} />
    </Suspense>
  );
}

function InsightsPanelFallback({
  heading = 'h2',
  headerClassName = 'pt-16 pb-6 sm:pt-24 lg:pt-36',
}: InsightsPanelProps) {
  const t = useTranslations('insights');
  const HeadingTag = heading;
  const titleClassName = [
    'text-foreground font-bold',
    heading === 'h1' ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl lg:text-3xl',
  ].join(' ');

  return (
    <div className={['flex flex-col gap-8 px-4 sm:px-8', headerClassName].join(' ')}>
      <HeadingTag className={titleClassName}>{t('title')}</HeadingTag>
    </div>
  );
}

export { HOMEPAGE_INSIGHTS_LIMIT };
