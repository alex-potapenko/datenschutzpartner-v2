'use client';

import { useTranslations } from 'next-intl';
import { EnvelopeSimple, FlagBanner } from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { formatCheckoutChf } from '@/components/shared/ServiceCheckoutPlanCard';

type EuRepCheckoutActivationProps = {
  email: string;
  legalEntity: string;
  planLabel: string;
  amount: number;
};

export function EuRepCheckoutActivation({
  email,
  legalEntity,
  planLabel,
  amount,
}: EuRepCheckoutActivationProps) {
  const t = useTranslations('account.euRepCheckout.activation');
  const tActivate = useTranslations('result.summary.activate');

  return (
    <main className="bg-background flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-10">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="bg-key-50 flex size-14 items-center justify-center rounded-2xl">
            <EnvelopeSimple size={28} weight="fill" className="text-accent" aria-hidden />
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-foreground text-2xl font-bold sm:text-3xl">
              {tActivate('title')}
            </h1>
            <p className="text-foreground text-base leading-relaxed text-pretty">
              {tActivate.rich('body', {
                email,
                strong: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </p>
          </div>
        </div>

        <section className="border-border overflow-hidden rounded-2xl border">
          <div className="border-border border-b px-5 py-4 sm:px-6">
            <p className="font-display text-foreground text-sm font-semibold">
              {tActivate('servicesTitle')}
            </p>
          </div>
          <div className="flex items-start gap-4 px-5 py-4 sm:px-6">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'color-mix(in oklab, var(--feature-indigo) 12%, transparent)',
                color: 'var(--feature-indigo)',
              }}
            >
              <FlagBanner size={18} weight="fill" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-foreground text-sm font-semibold">{tActivate('euRepTitle')}</p>
                <p className="text-muted text-sm leading-relaxed">
                  {legalEntity.trim()
                    ? tActivate('euRepDetail', { entity: legalEntity.trim() })
                    : tActivate('euRepDetailFallback')}
                </p>
                <p className="text-muted mt-1 text-sm">{planLabel}</p>
              </div>
              <div className="shrink-0 text-right whitespace-nowrap">
                <p className="text-foreground text-sm font-semibold tabular-nums">
                  <span>{formatCheckoutChf(amount)}</span>
                  <span className="text-muted ml-1 text-xs font-normal">
                    {tActivate('pricePeriod')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <p className="text-muted text-center text-sm leading-relaxed">{t('paymentNote')}</p>

        <NavigationLink href="/" chevron="right" className="self-center">
          {tActivate('goHome')}
        </NavigationLink>
      </div>
    </main>
  );
}
