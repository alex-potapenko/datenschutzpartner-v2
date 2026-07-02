'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Flag, Gavel, GlobeHemisphereEast, Tag } from '@/components/ui';

const STAT_KEYS = ['article27', 'establishment', 'eea', 'price'] as const;

type StatKey = (typeof STAT_KEYS)[number];

const STAT_ICONS: Record<StatKey, ReactNode> = {
  article27: <Gavel size={36} weight="fill" aria-hidden className="sm:size-11 lg:size-12" />,
  establishment: <Flag size={36} weight="fill" aria-hidden className="sm:size-11 lg:size-12" />,
  eea: (
    <GlobeHemisphereEast size={36} weight="fill" aria-hidden className="sm:size-11 lg:size-12" />
  ),
  price: <Tag size={36} weight="fill" aria-hidden className="sm:size-11 lg:size-12" />,
};

const STAT_BORDER_CLASSES = [
  'border-border border-b sm:border-r sm:border-b lg:border-b-0 lg:border-r',
  'border-border border-b lg:border-b-0 lg:border-r',
  'border-border border-b sm:border-r sm:border-b-0 lg:border-r',
  '',
];

export function EuRepStatsRowPanel() {
  const t = useTranslations('euRepPage.stats');

  return (
    <section className="border-border border-b" aria-label={t('ariaLabel')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_KEYS.map((key, index) => (
          <div
            key={key}
            className={['flex flex-col gap-3 p-4 sm:p-6 lg:p-8', STAT_BORDER_CLASSES[index]].join(
              ' '
            )}
          >
            <span style={{ color: 'var(--accent)' }}>{STAT_ICONS[key]}</span>
            <p className="text-muted text-sm leading-snug">{t(`${key}.label`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
