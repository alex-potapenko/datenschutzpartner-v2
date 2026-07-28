'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { useSubscriptions } from '@/api/billing';
import {
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  calculateGeneratorUpgradeQuote,
  canUpgradeGeneratorPlan,
  GENERATOR_PLAN_IDS,
  GENERATOR_PLAN_PRICES,
  generatorPlanSiteCount,
  getGeneratorPlanCheckoutState,
  isGeneratorUpgradeAllowed,
  type GeneratorPlanId,
} from '@/api/checkout';
import { useDocuments, useGeneratorPlan } from '@/api/documents';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import { Button, CaretRight, Spinner } from '@/components/ui';
import { RegularPage } from '@/components/shared/RegularPage';

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

function firstUpgradePlan(
  currentPlanId: GeneratorPlanId | null | undefined,
  usedSiteCount: number
): GeneratorPlanId | null {
  return (
    GENERATOR_PLAN_IDS.find((planId) =>
      isGeneratorUpgradeAllowed(planId, currentPlanId, usedSiteCount)
    ) ?? null
  );
}

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
        href: '/account?section=generator',
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
  const plan = useGeneratorPlan();
  const documents = useDocuments();
  const subscriptions = useSubscriptions();
  const [selectedPlanId, setSelectedPlanId] = useState<GeneratorPlanId | null>(null);
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();
  const isProcessing = createSession.isPending || completeSession.isPending;

  const policySub = subscriptions.data?.find((row) => row.productType === 'policy');
  const currentPlanId = plan.data?.planId ?? (policySub?.planId as GeneratorPlanId | undefined);
  const usedSiteCount = documents.data?.length ?? 0;

  const upgradePlanIds = useMemo(
    () =>
      GENERATOR_PLAN_IDS.filter((id) =>
        isGeneratorUpgradeAllowed(id, currentPlanId, usedSiteCount)
      ),
    [currentPlanId, usedSiteCount]
  );

  const planId = useMemo(() => {
    const fallback = firstUpgradePlan(currentPlanId, usedSiteCount) ?? upgradePlanIds[0] ?? 'team';
    if (selectedPlanId && GENERATOR_PLAN_IDS.includes(selectedPlanId)) {
      return selectedPlanId;
    }
    return fallback;
  }, [selectedPlanId, currentPlanId, usedSiteCount, upgradePlanIds]);

  const checkoutPlans: EuRepPlan[] = useMemo(
    () =>
      GENERATOR_PLAN_IDS.map((id) => ({
        id,
        tabLabel: tp(`plans.${id}.tabLabel`),
        showPerYear: false,
        price: GENERATOR_PLAN_PRICES[id].toFixed(2),
        note: tp('sitesIncluded', { count: generatorPlanSiteCount(id) }),
      })),
    [tp]
  );

  const unavailableFooterMessage = useMemo(() => {
    const state = getGeneratorPlanCheckoutState(planId, currentPlanId, usedSiteCount);
    if (state.status === 'current') return t('currentPlanMessage');
    if (state.status === 'unavailable') {
      return state.reason === 'insufficientSites'
        ? t('unavailableInsufficientSites')
        : t('unavailableLowerTier');
    }
    return undefined;
  }, [planId, currentPlanId, usedSiteCount, t]);

  useEffect(() => {
    if (plan.isLoading || documents.isLoading || subscriptions.isLoading) return;
    if (!canUpgradeGeneratorPlan(currentPlanId, usedSiteCount)) {
      router.replace('/account?section=generator');
    }
  }, [
    plan.isLoading,
    documents.isLoading,
    subscriptions.isLoading,
    currentPlanId,
    usedSiteCount,
    router,
  ]);

  const quote = useMemo(
    () =>
      calculateGeneratorUpgradeQuote({
        targetPlanId: planId,
        currentPlanId,
        lastOrderDate: policySub?.lastOrderDate,
        nextPaymentDate: policySub?.nextPaymentDate,
      }),
    [planId, currentPlanId, policySub?.lastOrderDate, policySub?.nextPaymentDate]
  );

  const canUpgrade = upgradePlanIds.length > 0;
  const isDataLoading = plan.isLoading || documents.isLoading || subscriptions.isLoading;

  async function handlePay() {
    if (!quote.isUpgrade) return;

    try {
      toast.info(t('redirecting'));
      const checkoutSession = await createSession.mutateAsync({
        kind: 'generatorTopUp',
        planId,
      });
      await new Promise((resolve) => setTimeout(resolve, 900));
      const result = await completeSession.mutateAsync(checkoutSession.id);
      toast.success(
        t('success', {
          allowance: result.siteAllowance,
        })
      );
      router.push('/account?section=generator');
    } catch {
      toast.error(t('failed'));
    }
  }

  if (isChecking || isDataLoading || !canUpgrade) {
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
        defaultPlanId={planId}
        value={planId}
        onPlanChange={(id) => {
          setSelectedPlanId(id as GeneratorPlanId);
        }}
        pricePeriod=""
        showOrderCta={false}
        layout="standalone"
        tabsAriaLabel={tp('selectPlan')}
        selectPlanTitle={tp('selectPlan')}
        includedTitle={tp('includedTitle')}
        features={GENERATOR_INCLUDED_KEYS.map((key) => tGenerator(`features.${key}`))}
        legal={tGenerator.rich('legal', {
          terms: (chunks) => <Link href="/terms">{chunks}</Link>,
        })}
        footer={
          quote.isUpgrade ? (
            <>
              {quote.creditAmount > 0 ? (
                <div className="flex items-start justify-between gap-4">
                  <p className="text-muted text-sm">{t('creditLine')}</p>
                  <p className="text-success shrink-0 text-sm font-medium">
                    − {formatChf(quote.creditAmount)}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4">
                <p className="text-foreground text-base font-semibold">{t('totalDue')}</p>
                <p className="text-foreground shrink-0 text-xl font-bold">
                  {formatChf(quote.amountDue)}
                </p>
              </div>

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
            </>
          ) : unavailableFooterMessage ? (
            <p className="text-muted py-2 text-center text-sm leading-relaxed">
              {unavailableFooterMessage}
            </p>
          ) : null
        }
      />
    </GeneratorUpgradePageShell>
  );
}
