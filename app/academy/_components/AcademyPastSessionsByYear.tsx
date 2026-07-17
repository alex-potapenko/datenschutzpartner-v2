'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/config';
import type { AcademyOnDemandItem } from '@/lib/academy-content/events';
import {
  AcademySessionList,
  PastSessionRow,
  type AcademyPreviewListLabels,
} from './academy-preview-list';

function groupPastSessionsByYear(items: AcademyOnDemandItem[]) {
  return items.reduce<Array<{ year: string; items: AcademyOnDemandItem[] }>>((acc, item) => {
    const year = new Date(item.liveAt).getFullYear().toString();
    const existing = acc.find((group) => group.year === year);

    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ year, items: [item] });
    }

    return acc;
  }, []);
}

export function getPastSessionYears(items: AcademyOnDemandItem[]): string[] {
  const years = new Set<string>();

  for (const item of items) {
    years.add(new Date(item.liveAt).getFullYear().toString());
  }

  return [...years].sort((a, b) => Number(b) - Number(a));
}

function PastSessionGroupList({
  items,
  locale,
  labels,
  showTypeChip,
  showCoverImage,
  listClassName,
}: {
  items: AcademyOnDemandItem[];
  locale: Locale;
  labels: AcademyPreviewListLabels;
  showTypeChip: boolean;
  showCoverImage: boolean;
  listClassName?: string;
}) {
  return (
    <AcademySessionList className={listClassName ?? 'm-0 p-0'}>
      {items.map((item) => (
        <PastSessionRow
          key={item.slug}
          item={item}
          locale={locale}
          labels={labels}
          showTypeChip={showTypeChip}
          showCoverImage={showCoverImage}
        />
      ))}
    </AcademySessionList>
  );
}

export function AcademyPastSessionsByYear({
  items,
  locale,
  labels,
  showTypeChip = true,
  showCoverImage = true,
  emptyMessage,
  listClassName,
  selectedYear,
}: {
  items: AcademyOnDemandItem[];
  locale: Locale;
  labels: AcademyPreviewListLabels;
  showTypeChip?: boolean;
  showCoverImage?: boolean;
  emptyMessage?: string;
  listClassName?: string;
  selectedYear?: string;
}) {
  const tPage = useTranslations('academy.pastSessions');
  const groups = useMemo(() => groupPastSessionsByYear(items), [items]);

  if (items.length === 0) {
    return <p className="text-muted text-sm">{emptyMessage ?? tPage('empty')}</p>;
  }

  if (selectedYear !== undefined) {
    const group = groups.find((entry) => entry.year === selectedYear) ?? groups[0];

    if (!group) {
      return <p className="text-muted text-sm">{emptyMessage ?? tPage('empty')}</p>;
    }

    return (
      <PastSessionGroupList
        items={group.items}
        locale={locale}
        labels={labels}
        showTypeChip={showTypeChip}
        showCoverImage={showCoverImage}
        listClassName={listClassName}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.year}>
          <h3 className="text-foreground mb-4 text-base font-semibold">{group.year}</h3>
          <PastSessionGroupList
            items={group.items}
            locale={locale}
            labels={labels}
            showTypeChip={showTypeChip}
            showCoverImage={showCoverImage}
            listClassName={listClassName}
          />
        </section>
      ))}
    </div>
  );
}
