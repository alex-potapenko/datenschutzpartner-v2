'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { calculateAmountInclVat, calculateVatAmount, formatSwissVatPercent } from '@/api/checkout';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';

export type CheckoutBreakdownLine = {
  label: ReactNode;
  detail?: string;
  amount: string;
  amountClassName?: string;
  labelWeight?: 'regular' | 'semibold';
  amountWeight?: 'regular' | 'semibold';
};

export function formatCheckoutChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

export function CheckoutPriceRow({
  label,
  detail,
  amount,
  amountClassName = 'text-foreground',
  labelWeight = 'regular',
  amountWeight = 'regular',
}: CheckoutBreakdownLine) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p
          className={`text-foreground text-sm ${labelWeight === 'semibold' ? 'font-semibold' : ''}`}
        >
          {label}
        </p>
        {detail ? <p className="text-muted text-sm">{detail}</p> : null}
      </div>
      <p
        className={`shrink-0 text-sm ${amountWeight === 'semibold' ? 'font-semibold' : ''} ${amountClassName}`}
      >
        {amount}
      </p>
    </div>
  );
}

export function CheckoutPriceBreakdown({
  lines,
  subtotalExclVat,
  payrexxNote,
}: {
  lines?: CheckoutBreakdownLine[];
  subtotalExclVat: number;
  payrexxNote?: string;
}) {
  const tSummary = useTranslations('result.summary');
  const vatAmount = calculateVatAmount(subtotalExclVat);
  const totalInclVat = calculateAmountInclVat(subtotalExclVat);

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border flex flex-col gap-3 border-t pt-4">
        {lines?.map((line, index) => (
          <CheckoutPriceRow key={index} {...line} />
        ))}
        <CheckoutPriceRow
          label={tSummary('subtotalExclVat')}
          amount={formatCheckoutChf(subtotalExclVat)}
        />
        <CheckoutPriceRow
          label={tSummary('vatLine', { rate: formatSwissVatPercent() })}
          amount={formatCheckoutChf(vatAmount)}
        />
        <CheckoutPriceRow
          label={tSummary('totalInclVat')}
          amount={formatCheckoutChf(totalInclVat)}
        />
        <CheckoutPriceRow
          label={tSummary('dueToday')}
          amount={formatCheckoutChf(totalInclVat)}
          labelWeight="semibold"
          amountWeight="semibold"
        />
      </div>
      {payrexxNote ? <p className="text-muted text-xs leading-relaxed">{payrexxNote}</p> : null}
    </div>
  );
}

type ServiceCheckoutPlanCardProps = {
  plans: EuRepPlan[];
  selectedPlanId: string;
  onPlanChange?: (planId: string) => void;
  selectPlanTitle: string;
  includedTitle: string;
  features: string[];
  featuresCollapsible?: boolean;
  legal?: ReactNode;
  pricePeriod: string;
  tabsAriaLabel: string;
  layout?: 'sidebar' | 'standalone';
  priceAlign?: 'start' | 'center';
  showPlanTitle?: boolean;
  breakdownLines?: CheckoutBreakdownLine[];
  subtotalExclVat: number;
  payrexxNote?: string;
  footerAction?: ReactNode;
};

export function ServiceCheckoutPlanCard({
  plans,
  selectedPlanId,
  onPlanChange,
  selectPlanTitle,
  includedTitle,
  features,
  featuresCollapsible = true,
  legal,
  pricePeriod,
  tabsAriaLabel,
  layout = 'sidebar',
  priceAlign = 'start',
  showPlanTitle = true,
  breakdownLines,
  subtotalExclVat,
  payrexxNote,
  footerAction,
}: ServiceCheckoutPlanCardProps) {
  return (
    <EuRepPlanCard
      plans={plans}
      defaultPlanId={selectedPlanId}
      value={selectedPlanId}
      onPlanChange={onPlanChange}
      layout={layout}
      pricePeriod={pricePeriod}
      priceAlign={priceAlign}
      showOrderCta={false}
      tabsAriaLabel={tabsAriaLabel}
      selectPlanTitle={selectPlanTitle}
      showPlanTitle={showPlanTitle}
      includedTitle={includedTitle}
      featuresCollapsible={featuresCollapsible}
      features={features}
      legal={legal}
      footerSectionClassName=""
      footerClassName=""
      postFeaturesFooter={
        <CheckoutPriceBreakdown
          lines={breakdownLines}
          subtotalExclVat={subtotalExclVat}
          payrexxNote={payrexxNote}
        />
      }
      footerAction={footerAction}
    />
  );
}
