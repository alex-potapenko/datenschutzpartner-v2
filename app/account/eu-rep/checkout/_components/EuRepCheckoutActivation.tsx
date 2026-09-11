'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, CaretRight, FlagBanner } from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PurchaseOrderConfirmationLayout } from '@/components/shared/PurchaseOrderConfirmationLayout';
import { OrderConfirmationNotices } from '@/components/shared/OrderConfirmationNotices';
import { TrialPeriodNotice } from '@/components/shared/TrialPeriodNotice';
import { formatCheckoutChf } from '@/components/shared/ServiceCheckoutPlanCard';
import { euRepAccountHref } from '@/lib/account-routes';

type EuRepCheckoutActivationProps = {
  legalEntity: string;
  planLabel: string;
  amount: number;
  newsletterOptIn?: boolean;
} & (
  | {
      variant: 'guest';
      email: string;
    }
  | {
      variant: 'logged';
      contractId: string;
    }
);

export function EuRepCheckoutActivation(props: EuRepCheckoutActivationProps) {
  const { legalEntity, planLabel, amount, variant, newsletterOptIn = false } = props;
  const t = useTranslations('account.euRepCheckout.activation');
  const tPayment = useTranslations('checkout.paymentConfirmation');
  const tActivate = useTranslations('result.summary.activate');
  const router = useRouter();
  const isLogged = variant === 'logged';

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
              <span>{t('plan', { plan: planLabel })}</span>
              <span aria-hidden className="mx-1.5">
                ·
              </span>
              <span>
                {legalEntity.trim()
                  ? tActivate('euRepDetail', { entity: legalEntity.trim() })
                  : tActivate('euRepDetailFallback')}
              </span>
            </p>
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
  );

  const footer = isLogged ? (
    <Button
      variant="primary"
      size="lg"
      className="font-display h-14 gap-2 rounded-full px-8 text-base"
      onPress={() => {
        router.push(
          euRepAccountHref({
            contract: props.contractId,
            tab: 'subscription',
          })
        );
      }}
    >
      {tActivate('showContract')}
      <CaretRight size={16} weight="bold" aria-hidden />
    </Button>
  ) : (
    <NavigationLink href="/" chevron="right">
      {tActivate('goHome')}
    </NavigationLink>
  );

  return (
    <PurchaseOrderConfirmationLayout
      titleLine1={isLogged ? tPayment('orderTrialTitle') : t('titleLine1')}
      titleLine2={isLogged ? undefined : t('titleLine2')}
      body={
        isLogged
          ? undefined
          : tActivate.rich('body', {
              email: props.email,
              strong: (chunks) => <span className="font-semibold">{chunks}</span>,
            })
      }
      orderSection={orderSection}
      afterOrder={
        <OrderConfirmationNotices
          trialNotice={isLogged ? <TrialPeriodNotice variant="euRep" showPaymentHint /> : undefined}
          newsletterOptIn={newsletterOptIn}
        />
      }
      footer={footer}
    />
  );
}
