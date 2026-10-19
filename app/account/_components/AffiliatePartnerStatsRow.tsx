'use client';

import { Fragment, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowsLeftRight, CurrencyDollar, CursorClick } from '@/components/ui';
import { PriceBlock, priceBlockAmountClassName } from '@/components/shared/PriceBlock';

const STATUS_BLOCK_ICON_STYLE = {
  color: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
} as const;

type AffiliatePartnerStatsRowProps = {
  clicks: number;
  conversions: number;
  balanceChf: number;
  /** 2×2 grid for the details left column; default is a single horizontal row. */
  layout?: 'row' | 'grid';
};

function StatColumn({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={STATUS_BLOCK_ICON_STYLE}
          aria-hidden
        >
          {icon}
        </span>
        <h3 className="text-foreground text-sm font-semibold">{label}</h3>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function StatDivider() {
  return <div className="bg-border h-px shrink-0 sm:h-auto sm:w-px sm:self-stretch" aria-hidden />;
}

export function AffiliatePartnerStatsRow({
  clicks,
  conversions,
  balanceChf,
  layout = 'row',
}: AffiliatePartnerStatsRowProps) {
  const t = useTranslations('account.affiliate.dashboard.stats');
  const tDashboard = useTranslations('account.affiliate.dashboard');

  const columns = [
    {
      key: 'clicks',
      icon: <CursorClick size={18} weight="fill" />,
      label: t('clicks'),
      value: (
        <p className={priceBlockAmountClassName('sm')} aria-label={`${t('clicks')}: ${clicks}`}>
          {clicks}
        </p>
      ),
    },
    {
      key: 'conversions',
      icon: <ArrowsLeftRight size={18} weight="bold" />,
      label: t('conversions'),
      value: (
        <p
          className={priceBlockAmountClassName('sm')}
          aria-label={`${t('conversions')}: ${conversions}`}
        >
          {conversions}
        </p>
      ),
    },
    {
      key: 'balance',
      icon: <CurrencyDollar size={18} weight="fill" />,
      label: t('totalBalance'),
      value: (
        <PriceBlock
          currency="CHF"
          amount={balanceChf.toFixed(2)}
          animatedAmount={balanceChf}
          size="sm"
        />
      ),
    },
  ] as const;

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-6" aria-label={tDashboard('statsAria')}>
        {columns.map((column) => (
          <StatColumn key={column.key} icon={column.icon} label={column.label}>
            {column.value}
          </StatColumn>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-6 sm:flex-row sm:items-stretch"
      aria-label={tDashboard('statsAria')}
    >
      {columns.map((column, index) => (
        <Fragment key={column.key}>
          {index > 0 ? <StatDivider /> : null}
          <StatColumn icon={column.icon} label={column.label}>
            {column.value}
          </StatColumn>
        </Fragment>
      ))}
    </div>
  );
}
