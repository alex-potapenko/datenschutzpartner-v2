'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  CaretRight,
  Button,
  Gavel,
  GraduationCap,
  ListChecks,
  MicrophoneStage,
  Tabs,
} from '@/components/ui';
import {
  filterAcademyPastSessions,
  getAcademyPastSessions,
  type AcademyOnDemandItem,
} from '@/lib/academy-content/events';
import {
  ACADEMY_OVERVIEW_FEATURE_KEYS,
  parseAcademyPastSessionTab,
  type AcademyOverviewFeatureKey,
  type AcademyPastSessionTab,
} from '@/lib/academy-content/constants';
import type { Locale } from '@/i18n/config';
import {
  AcademySessionList,
  PastSessionRow,
  type AcademyPreviewListLabels,
} from './academy-preview-list';
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
}: {
  items: AcademyOnDemandItem[];
  locale: Locale;
  labels: AcademyPreviewListLabels;
  showTypeChip?: boolean;
}) {
  const tPage = useTranslations('academy.pastSessions');

  const groups = items.reduce<Array<{ year: string; items: AcademyOnDemandItem[] }>>(
    (acc, item) => {
      const year = new Date(item.liveAt).getFullYear().toString();
      const existing = acc.find((group) => group.year === year);

      if (existing) {
        existing.items.push(item);
      } else {
        acc.push({ year, items: [item] });
      }

      return acc;
    },
    []
  );

  return (
    <div className="flex items-start">
      <div className="border-border min-w-0 flex-1 border-r p-4 sm:p-8">
        {items.length === 0 ? (
          <p className="text-muted text-sm">{tPage('empty')}</p>
        ) : (
          <Tabs defaultSelectedKey={groups[0]?.year} className="!gap-8">
            <Tabs.ListContainer>
              <Tabs.List aria-label={tPage('yearTabsNavigation')} className="!w-auto">
                {groups.map((group) => (
                  <Tabs.Tab key={group.year} id={group.year} className="!w-auto">
                    <span className="font-display">{group.year}</span>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>

            {groups.map((group) => (
              <Tabs.Panel key={group.year} id={group.year} className="!mt-0 !p-0">
                <AcademySessionList className="m-0 p-0">
                  {group.items.map((item) => (
                    <PastSessionRow
                      key={item.slug}
                      item={item}
                      locale={locale}
                      labels={labels}
                      showTypeChip={showTypeChip}
                    />
                  ))}
                </AcademySessionList>
              </Tabs.Panel>
            ))}
          </Tabs>
        )}
      </div>

      <AcademyBannerAside />
    </div>
  );
}

const OVERVIEW_FEATURE_ICONS: Record<AcademyOverviewFeatureKey, ReactNode> = {
  compliance: <Gavel size={18} weight="fill" aria-hidden />,
  sessions: <MicrophoneStage size={18} weight="fill" aria-hidden />,
  resources: <ListChecks size={18} weight="fill" aria-hidden />,
};

const OVERVIEW_FEATURE_ICON_STYLES: Record<
  AcademyOverviewFeatureKey,
  { color: string; background: string }
> = {
  compliance: {
    color: 'var(--feature-purple)',
    background: 'color-mix(in srgb, var(--feature-purple) 12%, transparent)',
  },
  sessions: {
    color: 'var(--feature-red)',
    background: 'color-mix(in srgb, var(--feature-red) 12%, transparent)',
  },
  resources: {
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 12%, transparent)',
  },
};

function AcademyOverviewFeatureIcon({ featureKey }: { featureKey: AcademyOverviewFeatureKey }) {
  const { color, background } = OVERVIEW_FEATURE_ICON_STYLES[featureKey];

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
      style={{ background, color }}
    >
      {OVERVIEW_FEATURE_ICONS[featureKey]}
    </div>
  );
}

function AcademyBannerAside() {
  const router = useRouter();
  const t = useTranslations('academy.landing');
  const tPage = useTranslations('academy.pastSessions');
  const tOverview = useTranslations('academy.landing.overview');

  return (
    <aside className="sticky top-24 hidden w-[400px] shrink-0 flex-col gap-5 p-8 lg:flex">
      <div className="flex flex-col gap-2">
        <p
          className="font-display inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: 'var(--accent)' }}
        >
          <GraduationCap size={20} weight="fill" aria-hidden />
          {t('heroTitle')}
        </p>
        <h2 className="font-display text-foreground text-2xl font-semibold">
          {tPage('bannerMembershipTitle')}
        </h2>
        <p className="text-foreground text-base leading-snug">{t('membershipDescription')}</p>
      </div>

      <ul className="flex flex-col gap-4">
        {ACADEMY_OVERVIEW_FEATURE_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-3">
            <AcademyOverviewFeatureIcon featureKey={key} />
            <p className="text-foreground text-sm leading-snug font-normal">
              {tOverview(`items.${key}.title`)}
            </p>
          </li>
        ))}
      </ul>

      <Button
        variant="primary"
        className="w-fit gap-2"
        onPress={() => {
          router.push('/academy');
        }}
      >
        {t('discoverCta')}
        <CaretRight size={16} weight="bold" aria-hidden />
      </Button>
    </aside>
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
