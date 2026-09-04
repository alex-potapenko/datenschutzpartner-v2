'use client';

import { useTranslations } from 'next-intl';
import { POLICY_TRIAL_DAYS } from '@/api/checkout';
import { Timer } from '@/components/ui';
import { cn } from '@/lib/utils';

export type TrialPeriodNoticeVariant = 'policy' | 'euRep' | 'policyAndEuRep';

export type TrialPeriodDaysLeft = {
  remainingDays: number;
  totalDays: number;
};

export type TrialPeriodNoticeProps = {
  variant: TrialPeriodNoticeVariant;
  /** Shown on the activation screen — omitted on in-account subscription tabs. */
  showPaymentHint?: boolean;
  /** "{n}-Day Trial Period" heading — activation only; hidden on subscription tabs. */
  showTitle?: boolean;
  daysLeft?: TrialPeriodDaysLeft | null;
  daysLeftAriaLabel?: string;
  className?: string;
};

function TrialPeriodProgressBar({
  remaining,
  total,
  label,
}: {
  remaining: number;
  total: number;
  label: string;
}) {
  const remainingFraction = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const isUrgent = remaining <= 1;
  const percent = Math.round(remainingFraction * 100);

  return (
    <div
      className="bg-border h-1.5 w-full overflow-hidden rounded-full"
      role="progressbar"
      aria-valuenow={remaining}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-[width,background-color] duration-300"
        style={{
          width: `${percent}%`,
          background: isUrgent ? 'var(--feature-red)' : 'var(--accent)',
        }}
      />
    </div>
  );
}

export function TrialPeriodNotice({
  variant,
  showPaymentHint = false,
  showTitle = true,
  daysLeft,
  daysLeftAriaLabel,
  className,
}: TrialPeriodNoticeProps) {
  const t = useTranslations('trialPeriod');

  const availabilityKey =
    variant === 'policyAndEuRep'
      ? 'availabilityPolicyAndEuRep'
      : variant === 'euRep'
        ? 'availabilityEuRep'
        : 'availabilityPolicy';

  const deadlineKey =
    variant === 'policyAndEuRep'
      ? 'deadlinePolicyAndEuRep'
      : variant === 'euRep'
        ? 'deadlineEuRep'
        : 'deadlinePolicy';

  const paymentHintKey = variant === 'policyAndEuRep' ? 'paymentHintEach' : 'paymentHintSelected';

  const bodyClassName = 'text-foreground text-sm leading-relaxed';

  return (
    <section className={cn('rounded-2xl bg-[var(--warning-soft)] px-5 py-4 sm:px-6', className)}>
      {showTitle ? (
        <p className="font-display mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--warning-soft-foreground)]">
          <Timer size={16} weight="fill" className="shrink-0" aria-hidden />
          <span>{t('title', { days: POLICY_TRIAL_DAYS })}</span>
        </p>
      ) : null}
      <div className={cn('flex flex-col gap-2', !showTitle && 'gap-0')}>
        <p className={bodyClassName}>
          {t(availabilityKey)} {t(deadlineKey)}
        </p>
        {showPaymentHint ? <p className={bodyClassName}>{t(paymentHintKey)}</p> : null}
      </div>
      {daysLeft && daysLeftAriaLabel ? (
        <div className="mt-3">
          <TrialPeriodProgressBar
            remaining={daysLeft.remainingDays}
            total={daysLeft.totalDays}
            label={daysLeftAriaLabel}
          />
        </div>
      ) : null}
    </section>
  );
}
