'use client';

import { Fragment, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  PriceBlock,
  priceBlockAmountClassName,
  priceBlockNoteClassName,
} from '@/components/shared/PriceBlock';

const STATUS_BLOCK_ICON_STYLE = {
  color: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
} as const;

type AffiliateStatItemBase = {
  key: string;
  icon: ReactNode;
  label: string;
  /** e.g. InfoTooltip next to the label */
  labelAside?: ReactNode;
};

export type AffiliateStatItem =
  | (AffiliateStatItemBase & {
      format: 'count' | 'chf' | 'percent';
      value: number;
      note?: string;
      subtitle?: string;
    })
  | (AffiliateStatItemBase & {
      format: 'referralStatusCounts';
      statusCounts: { pending: number; unpaid: number; paid: number };
      statusLabels: { pending: string; unpaid: string; paid: string };
    });

const REFERRAL_STATUS_COUNT_ORDER = ['pending', 'unpaid', 'paid'] as const;

function ReferralStatusCountsValue({
  counts,
  labels,
  groupLabel,
}: {
  counts: { pending: number; unpaid: number; paid: number };
  labels: { pending: string; unpaid: string; paid: string };
  groupLabel: string;
}) {
  const format = useFormatter();
  const parts = REFERRAL_STATUS_COUNT_ORDER.map((key) => {
    const value = counts[key];
    const formatted = format.number(value);
    return `${labels[key]} ${formatted}`;
  });

  return (
    <div
      className="flex flex-wrap items-end gap-x-6 gap-y-2"
      aria-label={`${groupLabel}: ${parts.join(', ')}`}
    >
      {REFERRAL_STATUS_COUNT_ORDER.map((key) => (
        <div key={key} className="flex items-end gap-2">
          <p className={priceBlockAmountClassName('sm')}>{format.number(counts[key])}</p>
          <span className={priceBlockNoteClassName('sm')}>{labels[key]}</span>
        </div>
      ))}
    </div>
  );
}

function StatColumn({ item }: { item: AffiliateStatItem }) {
  const format = useFormatter();
  const formatted =
    item.format === 'referralStatusCounts'
      ? ''
      : item.format === 'percent'
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
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="text-foreground text-sm font-semibold">{item.label}</h3>
          {item.labelAside}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {item.format === 'chf' ? (
          <PriceBlock
            currency="CHF"
            amount={item.value.toFixed(2)}
            animatedAmount={item.value}
            size="sm"
            notes={item.subtitle ? [item.subtitle] : item.note ? [item.note] : undefined}
          />
        ) : item.format === 'referralStatusCounts' ? (
          <ReferralStatusCountsValue
            counts={item.statusCounts}
            labels={item.statusLabels}
            groupLabel={item.label}
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
