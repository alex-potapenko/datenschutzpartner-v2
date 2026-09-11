'use client';

import type { ReactNode } from 'react';
import { Button, CaretRight, Timer } from '@/components/ui';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { DaysLeftBar } from './account-ui';
import {
  SubscriptionPricingMetadata,
  SubscriptionTrialPricingMetadata,
  type SubscriptionPricing,
} from './SubscriptionPricingMetadata';

export type ServiceSubscriptionCardState = 'active' | 'trial' | 'notSubscribed' | 'comingSoon';

export type ServiceSubscriptionCardProps = {
  icon?: ReactNode;
  accent?: string;
  iconTone?: 'accent' | 'trial';
  title: string;
  state: ServiceSubscriptionCardState;
  /** Inline badge after the service title — e.g. cancelled / expired status. */
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
  renewalInactiveNote?: string | null;
  notSubscribedLabel?: string;
  comingSoonLabel?: string;
  description?: string;
  muted?: boolean;
  aside?: ReactNode;
  /** Stretch to the grid row height; content stays top-aligned. */
  equalHeight?: boolean;
  onAction?: () => void;
  actionLabel?: string;
  onContinue?: () => void;
  continueLabel?: string;
  isContinuing?: boolean;
};

function SubscriptionOverviewMetric({
  daysLeft,
  daysLeftAriaLabel,
  daysLeftSuffix,
  urgentRemainingAtMost,
  progressVariant = 'default',
}: {
  daysLeft: { remainingDays: number; totalDays: number };
  daysLeftAriaLabel: string;
  daysLeftSuffix: string;
  urgentRemainingAtMost: number;
  progressVariant?: 'default' | 'success';
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
        urgentRemainingAtMost={urgentRemainingAtMost}
        variant={progressVariant}
      />
    </div>
  );
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
  renewalInactiveNote,
  notSubscribedLabel,
  comingSoonLabel,
  description,
  muted = false,
  aside,
  equalHeight = false,
  onAction,
  actionLabel,
  onContinue,
  continueLabel,
  isContinuing = false,
}: ServiceSubscriptionCardProps) {
  const hasDaysLeft = daysLeft != null && daysLeftSuffix != null && daysLeftAriaLabel != null;
  const hasActivePricing =
    state === 'active' &&
    pricing != null &&
    paidLabel &&
    renewalLabel &&
    discountTooltipLabel &&
    discountTooltip;
  const showSubscriptionContent =
    (state === 'active' && (hasDaysLeft || hasActivePricing)) || (state === 'trial' && hasDaysLeft);
  const showTrialTitleStyle = state === 'trial' && !trialLabel;

  return (
    <div
      className={
        equalHeight
          ? 'flex h-full min-w-0 flex-col gap-5 p-6 sm:p-8'
          : 'flex min-w-0 flex-col gap-5 p-6 sm:p-8'
      }
    >
      {icon ? (
        <div className="flex min-w-0 items-start">
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
                    background: `color-mix(in oklab, ${accent ?? 'var(--accent)'} 12%, transparent)`,
                    color: accent ?? 'var(--accent)',
                    opacity: muted ? 0.6 : 1,
                  }
            }
            aria-hidden
          >
            {icon}
          </span>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {showTrialTitleStyle ? (
            <h2 className="inline-flex items-center gap-2 text-base leading-snug font-semibold text-[var(--warning-soft-foreground)]">
              <Timer size={16} weight="fill" className="shrink-0" aria-hidden />
              <span>{title}</span>
            </h2>
          ) : (
            <h2 className="text-foreground text-base leading-snug font-semibold">{title}</h2>
          )}
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
          {statusBadge ? <span className="shrink-0">{statusBadge}</span> : null}
          {state === 'notSubscribed' && !statusBadge && notSubscribedLabel ? (
            <MetaBadge kind="notSubscribed" className="shrink-0">
              {notSubscribedLabel}
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
              {hasDaysLeft ? (
                <SubscriptionOverviewMetric
                  daysLeft={daysLeft}
                  daysLeftAriaLabel={daysLeftAriaLabel}
                  daysLeftSuffix={daysLeftSuffix}
                  urgentRemainingAtMost={state === 'trial' ? 1 : 29}
                  progressVariant={state === 'trial' ? 'success' : 'default'}
                />
              ) : null}
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
                  renewalInactiveNote={renewalInactiveNote}
                />
              ) : null}
              {state === 'trial' && onAction && actionLabel ? (
                <Button variant="primary" size="md" className="gap-2 self-start" onPress={onAction}>
                  {actionLabel}
                  <CaretRight size={16} weight="bold" className="shrink-0" aria-hidden />
                </Button>
              ) : null}
              {onContinue && continueLabel ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit self-start"
                  onPress={onContinue}
                  isDisabled={isContinuing}
                >
                  {continueLabel}
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
        ) : onContinue && continueLabel ? (
          <Button
            variant="outline"
            size="sm"
            className="w-fit self-start"
            onPress={onContinue}
            isDisabled={isContinuing}
          >
            {continueLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
