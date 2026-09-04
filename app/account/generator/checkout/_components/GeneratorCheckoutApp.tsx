'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { countActivePolicySites, useSubscriptions } from '@/api/billing';
import {
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  calculateGeneratorPolicyQuote,
  formatDiscountPercent,
  generatorVolumeDiscountExplanation,
  generatorVolumeDiscountRate,
  qualifyingSiteCountForCheckout,
} from '@/api/checkout';
import { PRIVACY_POLICY_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import { GeneratorPerSitePriceNote } from '@/components/shared/GeneratorPerSitePriceNote';
import {
  VolumeDiscountNote,
  VolumeDiscountThresholdsDialog,
} from '@/components/shared/VolumeDiscountDialog';
import { Button, CaretRight, Spinner, useOverlayState } from '@/components/ui';
import { RegularPage } from '@/components/shared/RegularPage';
import { SiteQuantityStepper } from '@/components/shared/SiteQuantityStepper';

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

function formatChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

function GeneratorUpgradePageShell({
  backLabel,
  children,
}: {
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <RegularPage
      topBarVariant="account"
      showFooter={false}
      noPadding
      minimal
      backLink={{
        href: PRIVACY_POLICY_ACCOUNT_HREF,
        label: backLabel,
        preferHref: true,
      }}
    >
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </RegularPage>
  );
}

export function GeneratorCheckoutApp() {
  const t = useTranslations('account.generatorCheckout');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const tGenerator = useTranslations('generatorPage');
  const tp = useTranslations('generatorPage.pricingSection');
  const router = useRouter();
  const { isChecking } = useRequireSession('/account/generator/checkout');
  const subscriptions = useSubscriptions();
  const [siteCount, setSiteCount] = useState(1);
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();
  const discountDialog = useOverlayState();
  const isProcessing = createSession.isPending || completeSession.isPending;

  const activeSites = countActivePolicySites(subscriptions.data ?? []);
  const qualifyingSites = qualifyingSiteCountForCheckout(activeSites, 'generator', siteCount);
  const quote = calculateGeneratorPolicyQuote(qualifyingSites, siteCount);
  const existingExplanation = generatorVolumeDiscountExplanation(activeSites);
  const cartExplanation = generatorVolumeDiscountExplanation(qualifyingSites);
  const cartUnlocksHigherTier =
    generatorVolumeDiscountRate(qualifyingSites) > generatorVolumeDiscountRate(activeSites);

  const checkoutPlans: EuRepPlan[] = useMemo(() => {
    const discountNote =
      cartUnlocksHigherTier && cartExplanation ? (
        <VolumeDiscountNote
          label={t('discountUnlocked', {
            count: qualifyingSites,
            percent: cartExplanation.percent,
          })}
          onOpen={() => {
            discountDialog.open();
          }}
        />
      ) : existingExplanation ? (
        <VolumeDiscountNote
          label={t('discountCurrent', {
            minSites: existingExplanation.minSites,
            percent: existingExplanation.percent,
          })}
          onOpen={() => {
            discountDialog.open();
          }}
        />
      ) : (
        tp('noDiscount')
      );

    return [
      {
        id: 'quantity',
        tabLabel: String(siteCount),
        showPerYear: true,
        price: quote.amountDue.toFixed(2),
        note: discountNote,
        noteClassName:
          existingExplanation || cartUnlocksHigherTier
            ? 'text-foreground text-sm leading-snug'
            : 'text-muted text-sm leading-snug',
      },
    ];
  }, [
    cartExplanation,
    cartUnlocksHigherTier,
    discountDialog,
    existingExplanation,
    qualifyingSites,
    quote.amountDue,
    quote.discountAmount,
    quote.listPrice,
    siteCount,
    t,
    tp,
  ]);

  const isDataLoading = subscriptions.isLoading;

  async function handlePay() {
    try {
      toast.info(t('redirecting'));
      const checkoutSession = await createSession.mutateAsync({
        kind: 'generator',
        siteCount,
      });
      await new Promise((resolve) => setTimeout(resolve, 900));
      const result = await completeSession.mutateAsync(checkoutSession.id);
      toast.success(
        t('success', {
          allowance: result.activeSubscriptionCount,
        })
      );
      router.push(PRIVACY_POLICY_ACCOUNT_HREF);
    } catch {
      toast.error(t('failed'));
    }
  }

  if (isChecking || isDataLoading) {
    return (
      <GeneratorUpgradePageShell backLabel={tCommon('back')}>
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </GeneratorUpgradePageShell>
    );
  }

  return (
    <GeneratorUpgradePageShell backLabel={tCommon('back')}>
      <EuRepPlanCard
        plans={checkoutPlans}
        defaultPlanId="quantity"
        value="quantity"
        pricePeriod={tp('pricePeriod')}
        showOrderCta={false}
        layout="standalone"
        tabsAriaLabel={tp('siteCountLabel')}
        selectPlanTitle={t('selectPlan')}
        includedTitle={tp('includedToggle')}
        featuresCollapsible
        selector={
          <SiteQuantityStepper
            value={siteCount}
            onChange={setSiteCount}
            decreaseLabel={tp('decreaseSites')}
            increaseLabel={tp('increaseSites')}
            valueLabel={tp('siteCountLabel')}
          />
        }
        features={GENERATOR_INCLUDED_KEYS.map((key) => tGenerator(`features.${key}`))}
        legal={tGenerator.rich('legal', {
          terms: (chunks) => <Link href="/terms">{chunks}</Link>,
        })}
        footer={
          <>
            <div className="flex items-start justify-between gap-4">
              <p className="text-foreground text-sm">{t('listPriceLine')}</p>
              <p
                className={`text-foreground shrink-0 text-sm ${quote.discountAmount > 0 ? 'line-through' : 'font-medium'}`}
              >
                {formatChf(quote.listPrice)}
              </p>
            </div>

            {quote.discountAmount > 0 ? (
              <div className="flex items-start justify-between gap-4">
                <p className="text-foreground text-sm">
                  {t('discountLine', { percent: formatDiscountPercent(quote.discountRate) })}
                </p>
                <p className="text-success shrink-0 text-sm font-medium">
                  − {formatChf(quote.discountAmount)}
                </p>
              </div>
            ) : null}

            <GeneratorPerSitePriceNote
              quote={quote}
              className="text-muted text-sm"
              collapsedMarginClass="-mt-3"
              onOpenDiscountDialog={() => {
                discountDialog.open();
              }}
            />
          </>
        }
        postFeaturesFooter={
          <div className="flex items-center justify-between gap-4">
            <p className="text-foreground text-base font-semibold">{t('totalDue')}</p>
            <p className="text-foreground shrink-0 text-base font-semibold">
              {formatChf(quote.amountDue)}
            </p>
          </div>
        }
        footerAction={
          <Button
            variant="primary"
            size="lg"
            className="font-display h-14 w-full gap-2 rounded-full text-base"
            onPress={() => void handlePay()}
            isDisabled={isProcessing}
          >
            {isProcessing ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" aria-hidden />
                {t('processing')}
              </span>
            ) : (
              <>
                {t('payCta')}
                <CaretRight size={16} weight="bold" aria-hidden />
              </>
            )}
          </Button>
        }
      />
      <VolumeDiscountThresholdsDialog state={discountDialog} />
    </GeneratorUpgradePageShell>
  );
}
