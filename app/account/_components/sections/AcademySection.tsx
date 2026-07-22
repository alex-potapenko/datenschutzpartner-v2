'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/config';
import {
  academySessionMatchesTab,
  filterAcademyPastSessions,
  filterAcademyUpcomingEvents,
  getAcademyPastSessions,
  getUpcomingAcademyCompactEvents,
  getUpcomingAcademyFeaturedEvent,
  resolveAcademyEventTitle,
} from '@/lib/academy-content/events';
import { ACCOUNT_UPCOMING_LIMIT } from '@/lib/academy-content/preview-schedule';
import { ACADEMY_ACCOUNT_RESOURCES } from '@/lib/academy-content/resources';
import {
  ACADEMY_PAST_SESSION_TAB_IDS,
  type AcademyPastSessionTab,
} from '@/lib/academy-content/constants';
import {
  Clock,
  GraduationCap,
  GridFour,
  Newspaper,
  Play,
  SearchField,
  Tabs,
  cn,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { AcademyMembershipPromoBanner } from '@/components/shared/AcademyMembershipPromoBanner';
import {
  AcademyPastSessionsByYear,
  getPastSessionYears,
} from '@/app/academy/_components/AcademyPastSessionsByYear';
import {
  AcademySessionList,
  NextLiveSessionRow,
  UpcomingCompactRow,
  type AcademyPreviewListLabels,
} from '@/app/academy/_components/academy-preview-list';
import {
  AccountFilterDropdown,
  AccountSectionFrame,
  ACCOUNT_TAB_PANEL_CLASS,
  EmptyState,
} from '../account-ui';
import { MembershipPanel } from './MembershipPanel';

const ACADEMY_TOP_TAB_IDS = ['sessions', 'resources', 'membership'] as const;
type AcademyTopTab = (typeof ACADEMY_TOP_TAB_IDS)[number];

type TimeFilter = 'upcoming' | 'past';

function matchesSessionSearch(text: string | undefined, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  if (!text) return false;
  return text.toLowerCase().includes(normalized);
}

function AccountAcademySessionList({
  tab,
  timeFilter,
  searchQuery,
  locale,
  labels,
  emptyUpcoming,
  emptyPast,
  emptySearch,
  selectedYear,
}: {
  tab: AcademyPastSessionTab;
  timeFilter: TimeFilter;
  searchQuery: string;
  locale: Locale;
  labels: AcademyPreviewListLabels;
  emptyUpcoming: string;
  emptyPast: string;
  emptySearch: string;
  selectedYear?: string;
}) {
  const featured = getUpcomingAcademyFeaturedEvent(locale);
  const compact = getUpcomingAcademyCompactEvents(locale);
  const pastSessions = getAcademyPastSessions(locale);

  const visibleFeatured =
    featured && academySessionMatchesTab(featured.type, tab) ? featured : undefined;
  const featuredTitle = visibleFeatured
    ? resolveAcademyEventTitle(locale, visibleFeatured)
    : undefined;
  const upcomingCompact = filterAcademyUpcomingEvents(compact, tab).slice(
    0,
    ACCOUNT_UPCOMING_LIMIT
  );
  const filteredPast = filterAcademyPastSessions(pastSessions, tab);

  const showFeatured =
    visibleFeatured && featuredTitle && matchesSessionSearch(featuredTitle, searchQuery);
  const searchFilteredUpcoming = upcomingCompact.filter((event) => {
    const title = resolveAcademyEventTitle(locale, event) ?? labels.tba;
    return matchesSessionSearch(title, searchQuery);
  });
  const searchFilteredPast = filteredPast.filter((item) =>
    matchesSessionSearch(item.title, searchQuery)
  );

  const hasUpcomingBeforeSearch =
    Boolean(visibleFeatured && featuredTitle) || upcomingCompact.length > 0;
  const hasComingUp = showFeatured || searchFilteredUpcoming.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

  if (timeFilter === 'upcoming') {
    if (!hasUpcomingBeforeSearch) {
      return <EmptyState message={emptyUpcoming} />;
    }

    if (!hasComingUp) {
      return <EmptyState message={hasSearchQuery ? emptySearch : emptyUpcoming} />;
    }

    return (
      <AcademySessionList>
        {showFeatured ? (
          <NextLiveSessionRow
            event={visibleFeatured}
            title={featuredTitle}
            locale={locale}
            labels={labels}
            showTypeChip={tab === 'all'}
          />
        ) : null}
        {searchFilteredUpcoming.map((event) => (
          <UpcomingCompactRow
            key={`${event.type}-${event.liveAt}`}
            event={event}
            locale={locale}
            labels={labels}
            showTypeChip={tab === 'all'}
            listItemClassName={showFeatured && featuredTitle ? 'px-4' : undefined}
          />
        ))}
      </AcademySessionList>
    );
  }

  if (filteredPast.length === 0) {
    return <EmptyState message={emptyPast} />;
  }

  if (searchFilteredPast.length === 0) {
    return <EmptyState message={hasSearchQuery ? emptySearch : emptyPast} />;
  }

  return (
    <AcademyPastSessionsByYear
      key={`${tab}-${searchQuery}-${selectedYear ?? 'all'}`}
      items={searchFilteredPast}
      locale={locale}
      labels={labels}
      showTypeChip={tab === 'all'}
      showCoverImage={false}
      emptyMessage={emptyPast}
      selectedYear={selectedYear}
    />
  );
}

function AcademyAccountResources() {
  const t = useTranslations('account.academy.resources');

  return (
    <ul className="border-border divide-border flex flex-col divide-y border-y">
      {ACADEMY_ACCOUNT_RESOURCES.map((resource) => (
        <li key={resource.id}>
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-foreground font-medium">{t(`items.${resource.id}.title`)}</p>
              <p className="text-muted text-sm leading-relaxed">
                {t(`items.${resource.id}.description`)}
              </p>
            </div>
            <NavigationLink
              href={resource.href}
              size="sm"
              className="shrink-0 self-start sm:self-center"
            >
              {resource.featureKey === 'employeeDeclaration' ? t('openGenerator') : t('view')}
            </NavigationLink>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SessionsTab() {
  const locale = useLocale() as Locale;
  const t = useTranslations('account.academy');
  const tPast = useTranslations('academy.pastSessions');
  const tPreview = useTranslations('academy.landing.preview');
  const [typeTab, setTypeTab] = useState<AcademyPastSessionTab>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('past');
  const [selectedYear, setSelectedYear] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const typeTabItems = ACADEMY_PAST_SESSION_TAB_IDS.map((id) => ({
    id,
    label:
      id === 'all' ? t('typeAll') : id === 'webinars' ? t('typeWebinar') : t('typeNewsQuestions'),
    icon:
      id === 'all' ? (
        <GridFour size={18} weight="fill" aria-hidden />
      ) : id === 'webinars' ? (
        <GraduationCap size={18} weight="fill" aria-hidden />
      ) : (
        <Newspaper size={18} weight="fill" aria-hidden />
      ),
  }));

  const timeTabItems: ReadonlyArray<{ id: TimeFilter; label: string; icon: ReactNode }> = [
    {
      id: 'upcoming',
      label: t('upcomingTitle'),
      icon: <Play size={18} weight="fill" aria-hidden />,
    },
    {
      id: 'past',
      label: t('recordingsTitle'),
      icon: <Clock size={18} weight="fill" aria-hidden />,
    },
  ];

  const availableYears = useMemo(() => {
    const pastSessions = getAcademyPastSessions(locale);
    const filtered = filterAcademyPastSessions(pastSessions, typeTab);
    const searchFiltered = filtered.filter((item) => matchesSessionSearch(item.title, searchQuery));

    return getPastSessionYears(searchFiltered);
  }, [locale, typeTab, searchQuery]);

  const activeYear =
    selectedYear && availableYears.includes(selectedYear) ? selectedYear : availableYears[0];

  const yearTabItems = availableYears.map((year) => ({
    id: year,
    label: year,
  }));

  const labels: AcademyPreviewListLabels = {
    nextLiveBadge: tPreview('nextLiveBadge'),
    webinarBadge: tPreview('webinarBadge'),
    newsQuestionsBadge: tPreview('newsQuestionsBadge'),
    readMore: tPreview('readMore'),
    tba: tPreview('tba'),
  };

  return (
    <div className="flex flex-col gap-6">
      <AcademyMembershipPromoBanner variant="horizontal" sessionType="all" />

      <div className="flex flex-col gap-8">
        <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-4">
            <AccountFilterDropdown
              ariaLabel={t('timeFilterLabel')}
              value={timeFilter}
              onChange={setTimeFilter}
              items={timeTabItems}
            />
            {timeFilter === 'past' && activeYear ? (
              <AccountFilterDropdown
                ariaLabel={tPast('yearTabsNavigation')}
                value={activeYear}
                onChange={setSelectedYear}
                items={yearTabItems}
              />
            ) : null}
            <AccountFilterDropdown
              ariaLabel={t('typeFilterLabel')}
              value={typeTab}
              onChange={(value) => {
                if (ACADEMY_PAST_SESSION_TAB_IDS.includes(value)) {
                  setTypeTab(value);
                }
              }}
              items={typeTabItems}
            />
          </div>
          <NavigationLink href="/academy/past-sessions" size="sm" className="shrink-0">
            {t('fullLibrary')}
          </NavigationLink>
          <div className="ml-auto w-64 min-w-48 shrink-0">
            <SearchField
              aria-label={t('searchLabel')}
              name="academy-session-search"
              variant="secondary"
              fullWidth
              value={searchQuery}
              onChange={setSearchQuery}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={t('searchPlaceholder')} />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
        </div>

        <AccountAcademySessionList
          tab={typeTab}
          timeFilter={timeFilter}
          searchQuery={searchQuery}
          locale={locale}
          labels={labels}
          emptyUpcoming={t('emptyUpcoming')}
          emptyPast={t('emptyRecordings')}
          emptySearch={t('emptySearch')}
          selectedYear={timeFilter === 'past' ? activeYear : undefined}
        />
      </div>
    </div>
  );
}

export function AcademySection({
  onNavigateToAccountDetails,
}: {
  onNavigateToAccountDetails?: () => void;
} = {}) {
  const t = useTranslations('account.academy');
  const [topTab, setTopTab] = useState<AcademyTopTab>('sessions');

  return (
    <AccountSectionFrame
      title={t('title')}
      tabsAriaLabel={t('tabsAriaLabel')}
      tabs={ACADEMY_TOP_TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) }))}
      selectedTab={topTab}
      onTabChange={(key) => {
        setTopTab(key as AcademyTopTab);
      }}
    >
      <Tabs.Panel id="sessions" className={cn(ACCOUNT_TAB_PANEL_CLASS, 'p-8')}>
        <SessionsTab />
      </Tabs.Panel>
      <Tabs.Panel id="resources" className={cn(ACCOUNT_TAB_PANEL_CLASS, 'p-8')}>
        <AcademyAccountResources />
      </Tabs.Panel>
      <Tabs.Panel id="membership" className={ACCOUNT_TAB_PANEL_CLASS}>
        <MembershipPanel
          productType="academy"
          onManagePayment={() => onNavigateToAccountDetails?.()}
        />
      </Tabs.Panel>
    </AccountSectionFrame>
  );
}
