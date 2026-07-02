'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CaretLeft, GraduationCap, Newspaper, Tabs } from '@/components/ui';
import { ArticlesGrid } from './ArticlesGrid';
import { HistoryBackLink } from './HistoryBackLink';
import {
  ACADEMY_TAB_IDS,
  getAcademyContent,
  parseAcademyTab,
  type AcademyTab,
} from '@/lib/academy-content';
import type { Locale } from '@/i18n/config';

const TAB_ICONS: Record<AcademyTab, ReactNode> = {
  webinars: <GraduationCap size={20} weight="fill" aria-hidden />,
  newsQuestions: <Newspaper size={20} weight="fill" aria-hidden />,
};

function AcademyPanelContent() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('academy');
  const activeTab = parseAcademyTab(searchParams.get('tab')) ?? 'webinars';
  const content = getAcademyContent(locale);

  const handleTabChange = (key: React.Key) => {
    const tab = key as AcademyTab;
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pt-20 pb-8 sm:px-8">
        <HistoryBackLink
          fallbackHref="/academy"
          label={t('backToOverview')}
          className="font-display inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--accent)]"
          style={{ color: 'var(--accent)' }}
        >
          <CaretLeft size={14} weight="bold" aria-hidden />
          {t('backToOverview')}
        </HistoryBackLink>
        <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('archiveTitle')}</h1>
      </div>

      <Tabs
        variant="secondary"
        selectedKey={activeTab}
        onSelectionChange={handleTabChange}
        className="w-full gap-0"
      >
        <Tabs.ListContainer className="border-border border-b px-4 sm:px-8">
          <Tabs.List aria-label={t('tabsNavigation')} className="!w-auto max-w-full !border-b-0">
            {ACADEMY_TAB_IDS.map((tab) => (
              <Tabs.Tab key={tab} id={tab} className="!h-auto !w-auto shrink-0 pb-4">
                <span className="font-display inline-flex items-center gap-2">
                  {TAB_ICONS[tab]}
                  {t(`tabs.${tab}`)}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        {ACADEMY_TAB_IDS.map((tab) => (
          <Tabs.Panel key={tab} id={tab} className="!mt-0 p-0">
            <ArticlesGrid articles={content[tab]} basePath="/academy" />
          </Tabs.Panel>
        ))}
      </Tabs>
    </>
  );
}

function AcademyPanelFallback() {
  const t = useTranslations('academy');

  return (
    <div className="flex flex-col gap-6 px-4 pt-20 pb-8 sm:px-8">
      <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('archiveTitle')}</h1>
    </div>
  );
}

export function AcademyPanel() {
  return (
    <Suspense fallback={<AcademyPanelFallback />}>
      <AcademyPanelContent />
    </Suspense>
  );
}
