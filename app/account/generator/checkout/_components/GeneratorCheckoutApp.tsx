'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import {
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  generatorPlanPrice,
  generatorPlanSiteCount,
  type GeneratorPlanId,
} from '@/api/checkout';
import { useGeneratorPlan } from '@/api/documents';
import { Button, Lock, ShieldCheck, Spinner } from '@/components/ui';
import { RegularPage } from '@/components/shared/RegularPage';
import { GeneratorPlanTabs } from '@/components/shared/GeneratorPlanTabs';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { AccountSection } from '../../../_components/account-ui';

export function GeneratorCheckoutApp() {
  const t = useTranslations('account.generatorCheckout');
  const tAccount = useTranslations('account');
  const router = useRouter();
  const { isChecking } = useRequireSession('/account/generator/checkout');
  const plan = useGeneratorPlan();
  const [planId, setPlanId] = useState<GeneratorPlanId>('team');
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();
  const isProcessing = createSession.isPending || completeSession.isPending;

  const siteCount = generatorPlanSiteCount(planId);
  const amount = generatorPlanPrice(planId);

  async function handlePay() {
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
          sites: siteCount,
          allowance: result.siteAllowance,
        })
      );
      router.push('/account?section=generator');
    } catch {
      toast.error(t('failed'));
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center">
        <Spinner aria-label={tAccount('loading')} />
      </div>
    );
  }

  return (
    <RegularPage
      topBarVariant="account"
      minimal
      showFooter={false}
      backLink={{ href: '/account?section=generator', label: t('backToGenerator') }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-foreground font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="text-muted text-base leading-relaxed">{t('description')}</p>
        </header>

        <AccountSection title={t('currentAllowance')} contentClassName="gap-3">
          <PriceBlock
            amount={String(plan.data?.siteAllowance ?? 0)}
            animatedAmount={plan.data?.siteAllowance ?? 0}
            notes={[t('allowanceNote')]}
            size="sm"
          />
        </AccountSection>

        <AccountSection title={t('selectPlan')} contentClassName="gap-4">
          <GeneratorPlanTabs value={planId} onChange={setPlanId} ariaLabel={t('selectPlan')} />
          <p className="text-muted text-sm leading-relaxed">{t('renewalResetNote')}</p>
        </AccountSection>

        <AccountSection title={t('summary')} contentClassName="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-foreground font-medium">{t('lineItem', { count: siteCount })}</p>
              <p className="text-muted text-sm">{t('lineItemDetail')}</p>
            </div>
            <p className="text-foreground shrink-0 font-semibold">CHF {amount.toFixed(2)}</p>
          </div>
          <div className="text-muted flex items-center gap-2 text-sm">
            <Lock size={16} aria-hidden />
            <span>{t('payrexxNote')}</span>
          </div>
          <div className="text-muted flex items-center gap-2 text-sm">
            <ShieldCheck size={16} weight="fill" className="text-success" aria-hidden />
            <span>{t('legalReviewNote')}</span>
          </div>
        </AccountSection>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-full"
            onPress={() => {
              router.push('/account?section=generator');
            }}
            isDisabled={isProcessing}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="h-12 rounded-full"
            onPress={() => void handlePay()}
            isDisabled={isProcessing}
          >
            {isProcessing ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" aria-hidden />
                {t('processing')}
              </span>
            ) : (
              t('payCta', { total: amount.toFixed(2) })
            )}
          </Button>
        </div>
      </div>
    </RegularPage>
  );
}
