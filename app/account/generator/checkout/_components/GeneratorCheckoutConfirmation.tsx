'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, CaretRight, FileText } from '@/components/ui';
import { PRIVACY_POLICY_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { PurchaseOrderConfirmationLayout } from '@/components/shared/PurchaseOrderConfirmationLayout';
import { TrialPeriodNotice } from '@/components/shared/TrialPeriodNotice';
import { formatCheckoutChf } from '@/components/shared/ServiceCheckoutPlanCard';

type GeneratorCheckoutConfirmationProps = {
  siteCount: number;
  amountDue: number;
};

export function GeneratorCheckoutConfirmation({
  siteCount,
  amountDue,
}: GeneratorCheckoutConfirmationProps) {
  const t = useTranslations('checkout.paymentConfirmation');
  const tGenerator = useTranslations('account.generatorCheckout');
  const tActivate = useTranslations('result.summary.activate');
  const router = useRouter();

  const orderSection = (
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
            background: 'color-mix(in oklab, var(--accent) 12%, transparent)',
            color: 'var(--accent)',
          }}
        >
          <FileText size={18} weight="fill" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-foreground text-sm font-semibold">{tActivate('policyTitle')}</p>
            <p className="text-muted text-sm leading-relaxed">
              {tGenerator('confirmationDetail', { count: siteCount })}
            </p>
          </div>
          <div className="shrink-0 text-right whitespace-nowrap">
            <p className="text-foreground text-sm font-semibold tabular-nums">
              <span>{formatCheckoutChf(amountDue)}</span>
              <span className="text-muted ml-1 text-xs font-normal">
                {tActivate('pricePeriod')}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <PurchaseOrderConfirmationLayout
      titleLine1={t('orderTrialTitle')}
      orderSection={orderSection}
      afterOrder={<TrialPeriodNotice variant="policy" showPaymentHint />}
      footer={
        <Button
          variant="primary"
          size="lg"
          className="font-display h-14 gap-2 rounded-full px-8 text-base"
          onPress={() => {
            router.push(PRIVACY_POLICY_ACCOUNT_HREF);
          }}
        >
          {t('viewPolicies')}
          <CaretRight size={16} weight="bold" aria-hidden />
        </Button>
      }
    />
  );
}
