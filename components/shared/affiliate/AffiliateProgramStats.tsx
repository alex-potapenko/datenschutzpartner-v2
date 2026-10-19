'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Clock, CurrencyDollar, User, UsersThree } from '@/components/ui';
import { FullBleedDivider } from '@/components/shared/FullBleedDivider';
import { cn } from '@/lib/utils';

const STAT_KEYS = ['commission', 'fullPrice', 'attribution'] as const;

type StatKey = (typeof STAT_KEYS)[number];

const STAT_TILE_SIZE = 'size-9 sm:size-11 lg:size-12';
const STAT_INNER_ICON = 'size-5 sm:size-6 lg:size-7';
const STAT_ARROW_SIZE = 'size-6 shrink-0 sm:size-7';

type IconTileStyle = {
  color: string;
  background: string;
};

function paleTileBackground(token: string) {
  return `color-mix(in srgb, ${token} 12%, transparent)`;
}

function StatIconTile({ children, tile }: { children: ReactNode; tile: IconTileStyle }) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-xl', STAT_TILE_SIZE)}
      style={{ color: tile.color, background: tile.background }}
    >
      {children}
    </div>
  );
}

function StatIconFlow({
  lead,
  trail,
  leadTile,
  trailTile,
}: {
  lead: ReactNode;
  trail: ReactNode;
  leadTile: IconTileStyle;
  trailTile: IconTileStyle;
}) {
  return (
    <span className="flex items-center gap-1 sm:gap-1.5" aria-hidden>
      <StatIconTile tile={leadTile}>{lead}</StatIconTile>
      <ArrowRight weight="bold" className={STAT_ARROW_SIZE} style={{ color: 'var(--accent)' }} />
      <StatIconTile tile={trailTile}>{trail}</StatIconTile>
    </span>
  );
}

const STAT_ICONS: Record<StatKey, ReactNode> = {
  commission: (
    <StatIconFlow
      lead={<CurrencyDollar weight="fill" className={STAT_INNER_ICON} />}
      trail={<User weight="fill" className={STAT_INNER_ICON} />}
      leadTile={{ color: 'var(--success)', background: paleTileBackground('var(--success)') }}
      trailTile={{ color: 'var(--accent)', background: paleTileBackground('var(--accent)') }}
    />
  ),
  fullPrice: (
    <StatIconFlow
      lead={<CurrencyDollar weight="fill" className={STAT_INNER_ICON} />}
      trail={<UsersThree weight="fill" className={STAT_INNER_ICON} />}
      leadTile={{ color: 'var(--accent)', background: paleTileBackground('var(--accent)') }}
      trailTile={{
        color: 'var(--feature-indigo)',
        background: paleTileBackground('var(--feature-indigo)'),
      }}
    />
  ),
  attribution: (
    <StatIconTile
      tile={{
        color: 'var(--feature-yellow)',
        background: paleTileBackground('var(--feature-yellow)'),
      }}
    >
      <Clock weight="fill" className={STAT_INNER_ICON} aria-hidden />
    </StatIconTile>
  ),
};

/** Three-column stats row — same border logic as generator/academy, last cell has no right border. */
const STAT_BORDER_PUBLIC = [
  'border-border border-b sm:border-r sm:border-b lg:border-b-0 lg:border-r',
  'border-border border-b lg:border-b-0 lg:border-r',
  'border-border border-b lg:border-b-0',
] as const;

const STAT_BORDER_EMBEDDED = [
  'border-border border-b sm:border-r sm:border-b xl:border-b-0 xl:border-r',
  'border-border border-b xl:border-b-0 xl:border-r',
  'border-border border-b xl:border-b-0',
] as const;

type AffiliateProgramStatsProps = {
  /** Mein Konto: 2 stats per row until xl (narrower column). */
  embeddedInAccount?: boolean;
};

export function AffiliateProgramStats({ embeddedInAccount = false }: AffiliateProgramStatsProps) {
  const t = useTranslations('affiliatePage.stats');
  const borderClasses = embeddedInAccount ? STAT_BORDER_EMBEDDED : STAT_BORDER_PUBLIC;

  return (
    <section aria-label={t('ariaLabel')}>
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2',
          embeddedInAccount ? 'xl:grid-cols-3' : 'lg:grid-cols-3'
        )}
      >
        {STAT_KEYS.map((key, index) => (
          <div
            key={key}
            className={cn('flex flex-col gap-2 p-4 sm:p-6 lg:p-8', borderClasses[index])}
          >
            <span>{STAT_ICONS[key]}</span>
            <p className="text-foreground text-base leading-snug font-semibold">
              {t(`${key}.title`)}
            </p>
            <p className="text-muted text-sm leading-snug">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
      <FullBleedDivider />
    </section>
  );
}
