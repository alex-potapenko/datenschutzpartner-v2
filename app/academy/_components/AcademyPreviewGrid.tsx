'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CaretRight, Clock, Play, Tabs } from '@/components/ui';
import type { Locale } from '@/i18n/config';
import {
  academySessionMatchesTab,
  filterAcademyPastSessions,
  filterAcademyUpcomingEvents,
  resolveAcademyEventTitle,
  type AcademyOnDemandItem,
  type AcademyUpcomingEvent,
} from '@/lib/academy-content/events';
import type { AcademyPastSessionTab } from '@/lib/academy-content/constants';
import {
  ACADEMY_SESSION_LIST_GAP_PX,
  ACADEMY_SESSION_ROW_HEIGHT_PX,
  AcademySessionList,
  NextLiveSessionRow,
  PastSessionRow,
  UpcomingCompactRow,
  type AcademyPreviewListLabels,
} from './academy-preview-list';
import {
  ACADEMY_PAST_SESSION_TAB_IDS,
  AcademySessionCategoryTabs,
} from './AcademySessionCategoryTabs';

type AcademyPreviewGridProps = {
  locale: Locale;
  labels: AcademyPreviewListLabels & {
    sectionTitle: string;
    comingUpTitle: string;
    comingUpEmpty: string;
    onDemandTitle: string;
    viewAllPastSessions: string;
    tabsNavigation: string;
    tabs: Record<AcademyPastSessionTab, string>;
  };
  featured?: AcademyUpcomingEvent;
  compact: AcademyUpcomingEvent[];
  pastSessions: AcademyOnDemandItem[];
  pastSessionsMinWhenComingUpEmpty: number;
};

type AcademyPreviewGridContentProps = {
  locale: Locale;
  labels: AcademyPreviewGridProps['labels'];
  tab: AcademyPastSessionTab;
  featured?: AcademyUpcomingEvent;
  compact: AcademyUpcomingEvent[];
  pastSessions: AcademyOnDemandItem[];
  pastSessionsMinWhenComingUpEmpty: number;
};

function AcademyPreviewGridContent({
  locale,
  labels,
  tab,
  featured,
  compact,
  pastSessions,
  pastSessionsMinWhenComingUpEmpty,
}: AcademyPreviewGridContentProps) {
  const comingUpRef = useRef<HTMLDivElement>(null);
  const pastListWrapperRef = useRef<HTMLDivElement>(null);

  const visibleFeatured =
    featured && academySessionMatchesTab(featured.type, tab) ? featured : undefined;
  const featuredTitle = visibleFeatured
    ? resolveAcademyEventTitle(locale, visibleFeatured)
    : undefined;
  const visibleCompact = filterAcademyUpcomingEvents(compact, tab);
  const filteredPastSessions = filterAcademyPastSessions(pastSessions, tab);
  const hasComingUp = Boolean((visibleFeatured && featuredTitle) || visibleCompact.length > 0);

  const [hasOverflow, setHasOverflow] = useState(
    !hasComingUp && filteredPastSessions.length > pastSessionsMinWhenComingUpEmpty
  );
  const [visiblePastSessionsCount, setVisiblePastSessionsCount] = useState(
    filteredPastSessions.length
  );

  const previewPastSessions = hasComingUp
    ? filteredPastSessions.slice(0, visiblePastSessionsCount)
    : filteredPastSessions.slice(
        0,
        Math.min(filteredPastSessions.length, pastSessionsMinWhenComingUpEmpty)
      );

  const pastSessionsHref =
    tab === 'all' ? '/academy/past-sessions' : `/academy/past-sessions?tab=${tab}`;

  useLayoutEffect(() => {
    const comingUpEl = comingUpRef.current;
    if (!comingUpEl) {
      return;
    }

    function measure() {
      const comingUpNode = comingUpRef.current;
      if (!comingUpNode) {
        return;
      }

      if (!hasComingUp) {
        setHasOverflow(filteredPastSessions.length > pastSessionsMinWhenComingUpEmpty);
        return;
      }

      const maxHeight = comingUpNode.offsetHeight;
      const rowStep = ACADEMY_SESSION_ROW_HEIGHT_PX + ACADEMY_SESSION_LIST_GAP_PX;
      const nextVisibleCount = Math.max(
        1,
        Math.floor((maxHeight + ACADEMY_SESSION_LIST_GAP_PX) / rowStep)
      );

      setVisiblePastSessionsCount(nextVisibleCount);
      setHasOverflow(nextVisibleCount < filteredPastSessions.length);
    }

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(comingUpEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, [filteredPastSessions.length, hasComingUp, pastSessionsMinWhenComingUpEmpty]);

  return (
    <div className="grid grid-cols-1 items-start lg:grid-cols-2 lg:items-stretch">
      <div className="border-border flex flex-col gap-8 border-b p-4 sm:p-8 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2">
          <Play size={22} weight="fill" style={{ color: 'var(--accent)' }} aria-hidden />
          <h3 className="text-foreground text-lg font-semibold">{labels.comingUpTitle}</h3>
        </div>

        <div ref={comingUpRef} className="mt-0">
          {hasComingUp ? (
            <AcademySessionList>
              {visibleFeatured && featuredTitle ? (
                <NextLiveSessionRow
                  event={visibleFeatured}
                  title={featuredTitle}
                  locale={locale}
                  labels={labels}
                  showTypeChip={tab === 'all'}
                />
              ) : null}
              {visibleCompact.map((event) => (
                <UpcomingCompactRow
                  key={`${event.type}-${event.liveAt}`}
                  event={event}
                  locale={locale}
                  labels={labels}
                  showTypeChip={tab === 'all'}
                  listItemClassName={visibleFeatured && featuredTitle ? 'px-4' : undefined}
                />
              ))}
            </AcademySessionList>
          ) : (
            <p className="text-muted text-sm">{labels.comingUpEmpty}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8 p-4 sm:p-8">
        <div className="flex items-center gap-2">
          <Clock size={22} weight="fill" style={{ color: 'var(--accent)' }} aria-hidden />
          <h3 className="text-foreground text-lg font-semibold">{labels.onDemandTitle}</h3>
        </div>

        <div className="mt-0 flex min-h-0 flex-1 flex-col gap-8">
          <div ref={pastListWrapperRef} className="overflow-visible">
            <AcademySessionList>
              {previewPastSessions.map((item) => (
                <PastSessionRow
                  key={item.slug}
                  item={item}
                  locale={locale}
                  labels={labels}
                  showTypeChip={tab === 'all'}
                  showCoverImage={false}
                />
              ))}
            </AcademySessionList>
          </div>

          {hasOverflow ? (
            <Link
              href={pastSessionsHref}
              className="inline-flex w-fit items-center gap-1 text-base font-normal transition-colors hover:text-[var(--link-hover)]"
              style={{ color: 'var(--accent)' }}
            >
              {labels.viewAllPastSessions} <CaretRight size={16} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AcademyPreviewGrid({
  locale,
  labels,
  featured,
  compact,
  pastSessions,
  pastSessionsMinWhenComingUpEmpty,
}: AcademyPreviewGridProps) {
  const [activeTab, setActiveTab] = useState<AcademyPastSessionTab>('all');

  return (
    <section>
      <div className="px-4 pt-16 pb-6 sm:px-8 sm:pt-24 sm:pb-8 lg:pt-36">
        <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
          {labels.sectionTitle}
        </h2>
      </div>

      <AcademySessionCategoryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabsNavigationLabel={labels.tabsNavigation}
        tabLabels={labels.tabs}
      >
        {ACADEMY_PAST_SESSION_TAB_IDS.map((tab) => (
          <Tabs.Panel key={tab} id={tab} className="!mt-0 p-0">
            <AcademyPreviewGridContent
              tab={tab}
              locale={locale}
              labels={labels}
              featured={featured}
              compact={compact}
              pastSessions={pastSessions}
              pastSessionsMinWhenComingUpEmpty={pastSessionsMinWhenComingUpEmpty}
            />
          </Tabs.Panel>
        ))}
      </AcademySessionCategoryTabs>

      <div
        aria-hidden
        className="border-border relative left-1/2 w-screen -translate-x-1/2 border-b"
      />
    </section>
  );
}
