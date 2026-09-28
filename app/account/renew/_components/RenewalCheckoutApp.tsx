'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import {
  countActivePolicySites,
  resolvePolicySiteCount,
  subscriptionRequiresPaidRenewal,
  useSubscriptions,
} from '@/api/billing';
import {
  calculateSubscriptionRenewalQuote,
  formatDiscountPercent,
  resolveEuRepPlan,
  useStartSubscriptionRenewal,
} from '@/api/checkout';
import { useDocuments } from '@/api/documents';
import { useEuRepContracts } from '@/api/eu-rep';
import type { EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import {
  formatCheckoutChf,
  ServiceCheckoutPlanCard,
  type CheckoutBreakdownLine,
} from '@/components/shared/ServiceCheckoutPlanCard';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import {
  VolumeDiscountNote,
  VolumeDiscountThresholdsDialog,
} from '@/components/shared/VolumeDiscountDialog';
import { Button, CaretRight, Spinner, useOverlayState } from '@/components/ui';
import { CheckoutPaymentButtonSpinner } from '@/components/shared/CheckoutPaymentButtonSpinner';
import { SUBSCRIPTION_RENEWAL_HREF, safeAccountReturnTo } from '@/lib/account-routes';
import { cn } from '@/lib/utils';
import { awaitPayrexxStubProcessing } from '@/lib/use-payrexx-payment-flow';

const FALLBACK_RETURN_TO = '/account';

function payrexxStubStartTime(): number {
  return Date.now();
}

const GENERATOR_INCLUDED_KEYS = [
  'services',
  'gdpr',
  'questions',
  'html',
  'fadp',
  'adjustments',
  'hosting',
  'pdf',
] as const;

const EU_REP_INCLUDED_KEYS = [
  'establishment',
  'art27',
  'mentionPolicy',
  'mentionRecords',
  'email',
  'post',
  'newsletter',
  'podcast',
] as const;

function StatusPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center sm:px-8">
      {children}
    </div>
  );
}

/** Price breakdown for restarting a lapsed subscription, then off to Payrexx. */
export function RenewalCheckoutApp() {
  const t = useTranslations('account.renewalCheckout');
  const tCheckout = useTranslations('account.checkout');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const tSummary = useTranslations('result.summary');
  const tGenerator = useTranslations('generatorPage');
  const tGeneratorPricing = useTranslations('generatorPage.pricingSection');
  const tEuRep = useTranslations('euRepPage');
  const tEuRepPricing = useTranslations('euRepPage.pricingSection');
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get('subscription') ?? '';
  const returnTo = safeAccountReturnTo(searchParams.get('returnTo')) ?? FALLBACK_RETURN_TO;
  const { isChecking } = useRequireSession(SUBSCRIPTION_RENEWAL_HREF);
  const subscriptions = useSubscriptions();
  const documents = useDocuments();
  const euRepContracts = useEuRepContracts();
  const startRenewal = useStartSubscriptionRenewal();
  const discountDialog = useOverlayState();

  const subscription = subscriptions.data?.find((row) => row.id === subscriptionId);
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handlePay() {
    if (!subscription || isRedirecting) return;
    setIsRedirecting(true);
    const started = payrexxStubStartTime();
    try {
      const session = await startRenewal.mutateAsync({
        subscriptionId: subscription.id,
        returnUrl: returnTo,
      });
      await awaitPayrexxStubProcessing(started);
      router.push(session.redirectUrl);
    } catch {
      toast.error(t('failed'));
      setIsRedirecting(false);
    }
  }

  function renderContent() {
    if (isChecking || subscriptions.isLoading || documents.isLoading || euRepContracts.isLoading) {
      return (
        <StatusPanel>
          <Spinner aria-label={tAccount('loading')} />
        </StatusPanel>
      );
    }

    if (!subscription || !subscriptionRequiresPaidRenewal(subscription)) {
      return (
        <StatusPanel>
          <h2 className="text-foreground text-2xl font-semibold">{t('emptyTitle')}</h2>
          <p className="text-foreground max-w-md text-sm leading-relaxed">{t('emptyBody')}</p>
        </StatusPanel>
      );
    }

    const quote = calculateSubscriptionRenewalQuote(
      subscription,
      countActivePolicySites(subscriptions.data ?? [])
    );
    const isPolicy = subscription.productType === 'policy';
    const breakdownLines: CheckoutBreakdownLine[] = [];
    let plans: EuRepPlan[];

    if (isPolicy) {
      const siteCount = resolvePolicySiteCount(subscription);
      const domain = documents.data?.find((row) => row.subscriptionId === subscription.id)?.site;
      plans = [
        {
          id: 'renewal',
          tabLabel: String(siteCount),
          showPerYear: true,
          price: quote.amountDue.toFixed(2),
          listPrice: quote.discountAmount > 0 ? quote.listPrice.toFixed(2) : undefined,
          note:
            quote.discountAmount > 0 ? (
              <span className="text-muted text-sm leading-snug">
                <VolumeDiscountNote
                  label={tGeneratorPricing('discountApplied', {
                    percent: formatDiscountPercent(quote.discountRate),
                  })}
                  onOpen={() => {
                    discountDialog.open();
                  }}
                />
              </span>
            ) : undefined,
        },
      ];
      breakdownLines.push({
        label: tSummary('generatorLine'),
        detail: domain
          ? tSummary('generatorLineDetail', { domain })
          : t('websitesDetail', { count: siteCount }),
        amount: formatCheckoutChf(quote.listPrice),
      });
      if (quote.discountAmount > 0) {
        breakdownLines.push({
          label: (
            <VolumeDiscountNote
              label={tSummary('discountLine', {
                percent: formatDiscountPercent(quote.discountRate),
              })}
              onOpen={() => {
                discountDialog.open();
              }}
            />
          ),
          amount: `− ${formatCheckoutChf(quote.discountAmount)}`,
          amountClassName: 'text-success',
        });
      }
    } else {
      const planId = resolveEuRepPlan(subscription.planId).id;
      const entity = euRepContracts.data?.find(
        (row) => row.subscriptionId === subscription.id
      )?.legalEntity;
      plans = [
        {
          id: 'renewal',
          tabLabel: tEuRep(`plans.${planId}.name`),
          showPerYear: true,
          price: quote.amountDue.toFixed(2),
        },
      ];
      breakdownLines.push({
        label: t('euRepPlanLine', { plan: tEuRep(`plans.${planId}.name`) }),
        detail: entity ? tSummary('euRepLineDetailNamed', { entity }) : undefined,
        amount: formatCheckoutChf(quote.amountDue),
      });
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
        <ServiceCheckoutPlanCard
          plans={plans}
          selectedPlanId="renewal"
          layout="standalone"
          pricePeriod={isPolicy ? tGeneratorPricing('pricePeriod') : tEuRep('pricePeriod')}
          tabsAriaLabel={
            isPolicy ? tGeneratorPricing('siteCountLabel') : tEuRepPricing('entityCountLabel')
          }
          showPlanTitle={false}
          selectPlanTitle={t('title')}
          includedTitle={
            isPolicy ? tGeneratorPricing('includedToggle') : tEuRepPricing('includedToggle')
          }
          features={
            isPolicy
              ? GENERATOR_INCLUDED_KEYS.map((key) => tGenerator(`features.${key}`))
              : EU_REP_INCLUDED_KEYS.map((key) => tEuRep(`features.${key}`))
          }
          legal={(isPolicy ? tGenerator : tEuRep).rich('legalCheckout', {
            terms: (chunks) => <Link href="/terms">{chunks}</Link>,
          })}
          breakdownLines={breakdownLines}
          subtotalExclVat={quote.amountDue}
          footerAction={
            <Button
              variant="primary"
              size="lg"
              className={cn(
                'font-display h-14 w-full gap-2 rounded-full text-base',
                isRedirecting && '!opacity-100'
              )}
              onPress={() => void handlePay()}
              isDisabled={isRedirecting}
            >
              {isRedirecting ? (
                <CheckoutPaymentButtonSpinner label={tCheckout('redirecting')} />
              ) : (
                <>
                  {tCheckout('payCta')}
                  <CaretRight size={16} weight="bold" aria-hidden />
                </>
              )}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <PolicyDetailPageShell backHref={returnTo} backLabel={tCommon('back')} detailTitle={t('title')}>
      {renderContent()}
      <VolumeDiscountThresholdsDialog state={discountDialog} />
    </PolicyDetailPageShell>
  );
}
