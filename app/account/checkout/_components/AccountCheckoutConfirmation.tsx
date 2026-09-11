'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, CaretRight, FileText, FlagBanner } from '@/components/ui';
import { useProfile } from '@/api/account';
import { PurchaseOrderConfirmationLayout } from '@/components/shared/PurchaseOrderConfirmationLayout';
import { OrderConfirmationNotices } from '@/components/shared/OrderConfirmationNotices';
import { TrialPeriodNotice } from '@/components/shared/TrialPeriodNotice';
import { formatCheckoutChf } from '@/components/shared/ServiceCheckoutPlanCard';
import { privacyPolicyAccountHref } from '@/lib/account-routes';

type AccountCheckoutConfirmationProps = {
  domain: string;
  legalEntity: string;
  policyAmount: number;
  euRepAmount: number;
  buyingEuRep: boolean;
};

export function AccountCheckoutConfirmation({
  domain,
  legalEntity,
  policyAmount,
  euRepAmount,
  buyingEuRep,
}: AccountCheckoutConfirmationProps) {
  const t = useTranslations('checkout.paymentConfirmation');
  const tActivate = useTranslations('result.summary.activate');
  const router = useRouter();
  const profile = useProfile();

  const orderSection = (
    <section className="border-border overflow-hidden rounded-2xl border">
      <div className="border-border border-b px-5 py-4 sm:px-6">
        <p className="font-display text-foreground text-sm font-semibold">
          {tActivate('servicesTitle')}
        </p>
      </div>
      <div className="divide-border divide-y">
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
                {tActivate('policyDetail', { domain })}
              </p>
            </div>
            <div className="shrink-0 text-right whitespace-nowrap">
              <p className="text-foreground text-sm font-semibold tabular-nums">
                <span>{formatCheckoutChf(policyAmount)}</span>
                <span className="text-muted ml-1 text-xs font-normal">
                  {tActivate('pricePeriod')}
                </span>
              </p>
            </div>
          </div>
        </div>
        {buyingEuRep ? (
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
              </div>
              <div className="shrink-0 text-right whitespace-nowrap">
                <p className="text-foreground text-sm font-semibold tabular-nums">
                  <span>{formatCheckoutChf(euRepAmount)}</span>
                  <span className="text-muted ml-1 text-xs font-normal">
                    {tActivate('pricePeriod')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );

  return (
    <PurchaseOrderConfirmationLayout
      titleLine1={t('orderTrialTitle')}
      orderSection={orderSection}
      afterOrder={
        <OrderConfirmationNotices
          trialNotice={
            <TrialPeriodNotice
              variant={buyingEuRep ? 'policyAndEuRep' : 'policy'}
              showPaymentHint
            />
          }
          newsletterOptIn={profile.data?.newsletterOptIn}
        />
      }
      footer={
        <Button
          variant="primary"
          size="lg"
          className="font-display h-14 gap-2 rounded-full px-8 text-base"
          onPress={() => {
            router.push(privacyPolicyAccountHref({ site: domain, tab: 'subscription' }));
          }}
        >
          {t('viewSubscription')}
          <CaretRight size={16} weight="bold" aria-hidden />
        </Button>
      }
    />
  );
}
