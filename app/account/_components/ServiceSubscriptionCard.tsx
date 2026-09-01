'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { DaysLeftBar } from './account-ui';
import {
  SubscriptionPricingMetadata,
  SubscriptionTrialPricingMetadata,
  type SubscriptionPricing,
} from './SubscriptionPricingMetadata';

export type ServiceSubscriptionCardState = 'active' | 'trial' | 'notSubscribed' | 'comingSoon';

export type ServiceSubscriptionCardProps = {
  icon: ReactNode;
  accent: string;
  iconTone?: 'accent' | 'trial';
  title: string;
  state: ServiceSubscriptionCardState;
  /** Corner badge for active subscriptions — e.g. non-active status. */
  statusBadge?: ReactNode;
  trialLabel?: string;
  daysLeft?: { remainingDays: number; totalDays: number } | null;
  daysLeftAriaLabel?: string | null;
  daysLeftSuffix?: string | null;
  pricing?: SubscriptionPricing | null;
  trialPricing?: {
    currency: string;
    dueAmount: number;
    pricePeriod: string;
  } | null;
  paidLabel?: string;
  renewalLabel?: string;
  duePaymentLabel?: string;
  renewalAfterPaymentNote?: string;
  discountTooltipLabel?: string;
  discountTooltip?: (params: { minSites: number; percent: string }) => string;
  notSubscribedLabel?: string;
  comingSoonLabel?: string;
  description?: string;
  muted?: boolean;
  aside?: ReactNode;
  /** Stretch to the grid row height; content stays top-aligned. */
  equalHeight?: boolean;
  onAction?: () => void;
  actionLabel?: string;
};

function SubscriptionOverviewMetric({
  daysLeft,
  daysLeftAriaLabel,
  daysLeftSuffix,
}: {
  daysLeft: { remainingDays: number; totalDays: number };
  daysLeftAriaLabel: string;
  daysLeftSuffix: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="flex items-center gap-2">
        <span className="font-display text-foreground text-4xl leading-none font-bold tracking-tight tabular-nums">
          {daysLeft.remainingDays}
        </span>
        <span className="text-muted text-sm font-normal">{daysLeftSuffix}</span>
      </p>
      <DaysLeftBar
        remaining={daysLeft.remainingDays}
        total={daysLeft.totalDays}
        label={daysLeftAriaLabel}
      />
    </div>
  );
}

function ServiceStatusBadge({
  state,
  statusBadge,
  notSubscribedLabel,
}: {
  state: ServiceSubscriptionCardState;
  statusBadge?: ReactNode;
  notSubscribedLabel?: string;
}) {
  if (statusBadge) return statusBadge;

  if (state === 'notSubscribed' && notSubscribedLabel) {
    return <MetaBadge kind="notSubscribed">{notSubscribedLabel}</MetaBadge>;
  }

  return null;
}

/**
 * Overview card for a website-scoped service — coming soon, not subscribed, trial, or active subscription.
 */
export function ServiceSubscriptionCard({
  icon,
  accent,
  iconTone = 'accent',
  title,
  state,
  statusBadge,
  trialLabel,
  daysLeft,
  daysLeftAriaLabel,
  daysLeftSuffix,
  pricing,
  trialPricing,
  paidLabel,
  renewalLabel,
  duePaymentLabel,
  renewalAfterPaymentNote,
  discountTooltipLabel,
  discountTooltip,
  notSubscribedLabel,
  comingSoonLabel,
  description,
  muted = false,
  aside,
  equalHeight = false,
  onAction,
  actionLabel,
}: ServiceSubscriptionCardProps) {
  const showSubscriptionContent =
    (state === 'active' || state === 'trial') &&
    daysLeft != null &&
    daysLeftSuffix != null &&
    daysLeftAriaLabel != null;

  return (
    <div
      className={
        equalHeight
          ? 'flex h-full min-w-0 flex-col gap-5 p-6 sm:p-8'
          : 'flex min-w-0 flex-col gap-5 p-6 sm:p-8'
      }
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={
            iconTone === 'trial'
              ? {
                  background: 'var(--warning-soft)',
                  color: 'var(--warning-soft-foreground)',
                  opacity: muted ? 0.6 : 1,
                }
              : {
                  background: `color-mix(in oklab, ${accent} 12%, transparent)`,
                  color: accent,
                  opacity: muted ? 0.6 : 1,
                }
          }
          aria-hidden
        >
          {icon}
        </span>
        <ServiceStatusBadge
          state={state}
          statusBadge={statusBadge}
          notSubscribedLabel={notSubscribedLabel}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-foreground text-base leading-snug font-semibold">{title}</h2>
          {state === 'trial' && trialLabel ? (
            <MetaBadge kind="trial" className="shrink-0">
              {trialLabel}
            </MetaBadge>
          ) : null}
          {state === 'comingSoon' && comingSoonLabel ? (
            <MetaBadge kind="soon" className="shrink-0">
              {comingSoonLabel}
            </MetaBadge>
          ) : null}
        </div>

        {showSubscriptionContent ? (
          <div
            className={
              aside
                ? 'flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8'
                : 'flex min-w-0 flex-col gap-4'
            }
          >
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <SubscriptionOverviewMetric
                daysLeft={daysLeft}
                daysLeftAriaLabel={daysLeftAriaLabel}
                daysLeftSuffix={daysLeftSuffix}
              />
              {state === 'trial' &&
              trialPricing &&
              duePaymentLabel &&
              renewalLabel &&
              renewalAfterPaymentNote ? (
                <SubscriptionTrialPricingMetadata
                  currency={trialPricing.currency}
                  dueAmount={trialPricing.dueAmount}
                  pricePeriod={trialPricing.pricePeriod}
                  duePaymentLabel={duePaymentLabel}
                  renewalLabel={renewalLabel}
                  renewalAfterPaymentNote={renewalAfterPaymentNote}
                />
              ) : pricing &&
                paidLabel &&
                renewalLabel &&
                discountTooltipLabel &&
                discountTooltip ? (
                <SubscriptionPricingMetadata
                  pricing={pricing}
                  paidLabel={paidLabel}
                  renewalLabel={renewalLabel}
                  discountTooltipLabel={discountTooltipLabel}
                  discountTooltip={discountTooltip}
                />
              ) : null}
              {state === 'trial' && onAction && actionLabel ? (
                <Button variant="primary" size="sm" className="self-start" onPress={onAction}>
                  {actionLabel}
                </Button>
              ) : null}
            </div>

            {aside ? (
              <>
                <div
                  className="bg-border h-px shrink-0 lg:h-auto lg:w-px lg:self-stretch"
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col">{aside}</div>
              </>
            ) : null}
          </div>
        ) : onAction && actionLabel ? (
          <div className="flex min-w-0 flex-col items-start gap-3">
            {description ? (
              <p className="text-muted text-sm leading-relaxed">{description}</p>
            ) : null}
            <Button
              variant={state === 'notSubscribed' ? 'primary' : 'outline'}
              size="sm"
              className="self-start"
              onPress={onAction}
            >
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
