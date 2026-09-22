import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Clock, CurrencyDollar, SealPercent, User, UsersThree } from '@/components/ui';
import { FullBleedDivider } from '@/components/shared/FullBleedDivider';

const STAT_KEYS = ['commission', 'voucher', 'attribution'] as const;

type StatKey = (typeof STAT_KEYS)[number];

const STAT_ICON_SIZE = 'size-9 sm:size-11 lg:size-12';
const STAT_ARROW_SIZE = 'size-6 shrink-0 sm:size-7';

function StatIconFlow({ lead, trail }: { lead: ReactNode; trail: ReactNode }) {
  return (
    <span className="flex items-center gap-1 sm:gap-1.5" aria-hidden>
      <span className={STAT_ICON_SIZE}>{lead}</span>
      <ArrowRight weight="bold" className={STAT_ARROW_SIZE} />
      <span className={STAT_ICON_SIZE}>{trail}</span>
    </span>
  );
}

const STAT_ICONS: Record<StatKey, ReactNode> = {
  commission: (
    <StatIconFlow
      lead={<CurrencyDollar weight="fill" className="size-full" />}
      trail={<User weight="fill" className="size-full" />}
    />
  ),
  voucher: (
    <StatIconFlow
      lead={<SealPercent weight="fill" className="size-full" />}
      trail={<UsersThree weight="fill" className="size-full" />}
    />
  ),
  attribution: <Clock size={36} weight="fill" aria-hidden className="sm:size-11 lg:size-12" />,
};

const STAT_BORDER_CLASSES = [
  'border-border border-b sm:border-r sm:border-b lg:border-b-0 lg:border-r',
  'border-border border-b lg:border-b-0 lg:border-r',
  'border-border border-b lg:border-b-0',
];

export async function AffiliateStatsRow() {
  const t = await getTranslations('affiliatePage.stats');

  return (
    <section aria-label={t('ariaLabel')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_KEYS.map((key, index) => (
          <div
            key={key}
            className={['flex flex-col gap-2 p-4 sm:p-6 lg:p-8', STAT_BORDER_CLASSES[index]].join(
              ' '
            )}
          >
            <span style={{ color: 'var(--accent)' }}>{STAT_ICONS[key]}</span>
            <p className="text-foreground text-base leading-snug font-semibold">
              {t(`${key}.title`)}
            </p>
            <p className="text-muted text-base leading-snug">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
      <FullBleedDivider />
    </section>
  );
}
