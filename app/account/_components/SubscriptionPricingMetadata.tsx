'use client';

import { useState } from 'react';
import {
  calculateEuRepQuote,
  calculateGeneratorPolicyQuote,
  generatorVolumeDiscountExplanation,
} from '@/api/checkout';
import { resolvePolicySiteCount, type Order, type Subscription } from '@/api/billing';
import { Info, Tooltip } from '@/components/ui';
import { formatMoney, useDateFormatter } from './account-ui';

export type SubscriptionPricing = {
  currency: string;
  annualAmount: number;
  renewalAmount: number;
  renewalListPrice?: number;
  discountExplanation?: { minSites: number; percent: string } | null;
  pricePeriod: string;
  paidDate: string;
  renewalDate: string | null;
};

export function lastOrderFor(subscription: Subscription, orders: Order[]): Order | undefined {
  return orders
    .filter((order) => subscription.relatedOrderIds.includes(order.id))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function buildSubscriptionPricing(
  subscription: Subscription,
  orders: Order[],
  activeSiteCount: number
): Omit<SubscriptionPricing, 'pricePeriod'> {
  const lastOrder = lastOrderFor(subscription, orders);
  const currency = subscription.totals.currency;
  const isPolicy = subscription.productType === 'policy';

  if (isPolicy) {
    const siteCount = resolvePolicySiteCount(subscription);
    const quote = calculateGeneratorPolicyQuote(activeSiteCount, siteCount);
    const discount = generatorVolumeDiscountExplanation(activeSiteCount);
    const annualAmount = lastOrder?.total ?? subscription.totals.total;

    return {
      currency,
      annualAmount,
      renewalAmount: quote.amountDue,
      renewalListPrice: quote.discountRate > 0 ? quote.listPrice : undefined,
      discountExplanation: discount,
      paidDate: lastOrder?.date ?? subscription.lastOrderDate ?? subscription.startDate,
      renewalDate: subscription.nextPaymentDate,
    };
  }

  const quote = calculateEuRepQuote(subscription.planId ?? 'basis');
  // Prefer the matching EU Rep order; ignore wrongly linked policy invoices in seed/demo data.
  const euRepOrder = lastOrder?.productType === 'euRep' ? lastOrder : undefined;
  const annualAmount = euRepOrder?.total ?? subscription.totals.total;

  return {
    currency,
    annualAmount,
    renewalAmount: quote.amountDue,
    paidDate: euRepOrder?.date ?? subscription.lastOrderDate ?? subscription.startDate,
    renewalDate: subscription.nextPaymentDate,
  };
}

export function SubscriptionPaidPricing({
  pricing,
  label,
}: {
  pricing: SubscriptionPricing;
  label: string;
}) {
  const formatDate = useDateFormatter();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-muted text-xs font-medium">{label}</span>
      <div className="flex flex-col gap-0.5">
        <p className="text-foreground text-sm leading-snug">
          {formatMoney(pricing.annualAmount, pricing.currency)}{' '}
          <span className="text-muted">{pricing.pricePeriod}</span>
        </p>
        <p className="text-muted text-sm leading-snug">{formatDate(pricing.paidDate)}</p>
      </div>
    </div>
  );
}

export function SubscriptionRenewalPricing({
  pricing,
  label,
  discountTooltipLabel,
  discountTooltip,
}: {
  pricing: SubscriptionPricing;
  label: string;
  discountTooltipLabel: string;
  discountTooltip: (params: { minSites: number; percent: string }) => string;
}) {
  const formatDate = useDateFormatter();
  const [isDiscountTooltipOpen, setIsDiscountTooltipOpen] = useState(false);
  const listPrice = pricing.renewalListPrice;
  const hasDiscount =
    listPrice != null && listPrice > pricing.renewalAmount && pricing.discountExplanation;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-muted text-xs font-medium">{label}</span>
      <div className="flex flex-col gap-0.5">
        <div className="text-foreground flex flex-wrap items-center gap-x-1 text-sm leading-snug">
          {hasDiscount ? (
            <>
              <span>{pricing.currency}</span>
              <span className="text-muted/70 tabular-nums line-through decoration-from-font">
                {listPrice.toFixed(2)}
              </span>
              <span className="tabular-nums">{pricing.renewalAmount.toFixed(2)}</span>
            </>
          ) : (
            <span>{formatMoney(pricing.renewalAmount, pricing.currency)}</span>
          )}
          {hasDiscount && pricing.discountExplanation ? (
            <Tooltip
              delay={0}
              closeDelay={0}
              isOpen={isDiscountTooltipOpen}
              onOpenChange={setIsDiscountTooltipOpen}
            >
              <Tooltip.Trigger
                aria-label={discountTooltipLabel}
                className="text-accent hover:text-key-700 inline-flex cursor-pointer items-center justify-center"
                onPointerEnter={() => {
                  setIsDiscountTooltipOpen(true);
                }}
                onPointerLeave={() => {
                  setIsDiscountTooltipOpen(false);
                }}
              >
                <Info size={16} weight="bold" aria-hidden />
              </Tooltip.Trigger>
              <Tooltip.Content className="w-max max-w-xs p-3 text-sm leading-relaxed">
                {discountTooltip({
                  minSites: pricing.discountExplanation.minSites,
                  percent: pricing.discountExplanation.percent,
                })}
              </Tooltip.Content>
            </Tooltip>
          ) : null}
        </div>
        {pricing.renewalDate ? (
          <p className="text-muted text-sm leading-snug">{formatDate(pricing.renewalDate)}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SubscriptionTrialPricingMetadata({
  currency,
  dueAmount,
  pricePeriod,
  duePaymentLabel,
  renewalLabel,
  renewalAfterPaymentNote,
}: {
  currency: string;
  dueAmount: number;
  pricePeriod: string;
  duePaymentLabel: string;
  renewalLabel: string;
  renewalAfterPaymentNote: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-muted text-xs font-medium">{duePaymentLabel}</span>
        <p className="text-foreground text-sm leading-snug font-semibold">
          {formatMoney(dueAmount, currency)}{' '}
          <span className="text-muted font-normal">{pricePeriod}</span>
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-muted text-xs font-medium">{renewalLabel}</span>
        <p className="text-foreground text-sm leading-snug">{renewalAfterPaymentNote}</p>
      </div>
    </div>
  );
}

export function SubscriptionPricingMetadata({
  pricing,
  paidLabel,
  renewalLabel,
  discountTooltipLabel,
  discountTooltip,
}: {
  pricing: SubscriptionPricing;
  paidLabel: string;
  renewalLabel: string;
  discountTooltipLabel: string;
  discountTooltip: (params: { minSites: number; percent: string }) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SubscriptionPaidPricing pricing={pricing} label={paidLabel} />
      <SubscriptionRenewalPricing
        pricing={pricing}
        label={renewalLabel}
        discountTooltipLabel={discountTooltipLabel}
        discountTooltip={discountTooltip}
      />
    </div>
  );
}
