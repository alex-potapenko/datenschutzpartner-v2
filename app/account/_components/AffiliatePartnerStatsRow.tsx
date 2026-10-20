'use client';

import { Fragment, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { PriceBlock, priceBlockAmountClassName } from '@/components/shared/PriceBlock';

const STATUS_BLOCK_ICON_STYLE = {
  color: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
} as const;

export type AffiliateStatItem = {
  key: string;
  icon: ReactNode;
  label: string;
  value: number;
  format: 'count' | 'chf' | 'percent';
  /** Short line under the value, e.g. what the number means for the next payout. */
  note?: string;
};

function StatColumn({ item }: { item: AffiliateStatItem }) {
  const format = useFormatter();
  const formatted =
    item.format === 'percent'
      ? format.number(item.value, { style: 'percent', maximumFractionDigits: 1 })
      : format.number(item.value);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={STATUS_BLOCK_ICON_STYLE}
          aria-hidden
        >
          {item.icon}
        </span>
        <h3 className="text-foreground text-sm font-semibold">{item.label}</h3>
      </div>
      <div className="flex flex-col gap-2">
        {item.format === 'chf' ? (
          <PriceBlock
            currency="CHF"
            amount={item.value.toFixed(2)}
            animatedAmount={item.value}
            size="sm"
            notes={item.note ? [item.note] : undefined}
          />
        ) : (
          <>
            <p
              className={priceBlockAmountClassName('sm')}
              aria-label={`${item.label}: ${formatted}`}
            >
              {formatted}
            </p>
            {item.note ? <p className="text-muted text-xs leading-snug">{item.note}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}

function StatDivider() {
  return <div className="bg-border h-px shrink-0 sm:h-auto sm:w-px sm:self-stretch" aria-hidden />;
}

export function AffiliatePartnerStatsRow({ items }: { items: readonly AffiliateStatItem[] }) {
  const t = useTranslations('account.affiliate.dashboard');

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch" aria-label={t('statsAria')}>
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? <StatDivider /> : null}
          <StatColumn item={item} />
        </Fragment>
      ))}
    </div>
  );
}
