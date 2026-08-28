'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { CheckoutCompleteResult } from '@/api/checkout';
import {
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  GENERATOR_PLAN_IDS,
  GENERATOR_PLAN_PRICES,
  generatorPlanPrice,
  generatorPlanSiteCount,
  type GeneratorPlanId,
} from '@/api/checkout';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import { Button, CaretRight, Spinner } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { StepFooter } from '../ui/StepFooter';
import { StepHeader } from '../ui/StepHeader';
import { EU_REP_PLANS, type ImprovedFormData } from '../content/improved-form';
import type { EuRepState } from '../wizard-state';

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

interface PaymentStepProps {
  domain: string;
  formData: ImprovedFormData;
  euRep: EuRepState;
  onPaid: (result: CheckoutCompleteResult) => void;
  onBack: () => void;
}

function parsePrice(price: string): number {
  return Number(price.replace(/[^\d.]/g, '')) || 0;
}

function formatChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

export function PaymentStep({ domain, euRep, onPaid, onBack }: PaymentStepProps) {
  const t = useTranslations('result.checkout');
  const tPay = useTranslations('account.generatorCheckout');
  const tGenerator = useTranslations('generatorPage');
  const tp = useTranslations('generatorPage.pricingSection');
  const [planId, setPlanId] = useState<GeneratorPlanId>('team');
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();
  const isProcessing = createSession.isPending || completeSession.isPending;

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

  const euRepAmount = euRep.plan ? parsePrice(EU_REP_PLANS[euRep.plan].price) : 0;
  const generatorAmount = generatorPlanPrice(planId);
  const siteCount = generatorPlanSiteCount(planId);
  const additionalSites = Math.max(0, siteCount - 1);
  const total = generatorAmount + euRepAmount;

  async function handlePay() {
    try {
      toast.info(t('redirecting'));
      const session = await createSession.mutateAsync({
        kind: 'generator',
        planId,
        domain,
        policyName: 'Privacy Policy',
        euRepPlanId: euRep.plan,
      });

      await new Promise((resolve) => setTimeout(resolve, 900));

      const result = await completeSession.mutateAsync(session.id);
      toast.success(t('paymentConfirmed'));
      onPaid(result);
    } catch {
      toast.error(t('paymentFailed'));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StepHeader title={t('title')} description={<p>{t('description')}</p>} />

      <Container className="flex min-h-0 flex-1 flex-col overflow-visible">
        <div className="border-border flex min-h-0 flex-1 flex-col justify-center overflow-visible border-r border-l">
          <EuRepPlanCard
            plans={checkoutPlans}
            defaultPlanId={planId}
            value={planId}
            onPlanChange={(id) => {
              setPlanId(id as GeneratorPlanId);
            }}
            pricePeriod=""
            showOrderCta={false}
            layout="standalone"
            fillHeight
            tabsAriaLabel={tp('selectPlan')}
            selectPlanTitle={tp('selectPlan')}
            includedTitle={tp('includedTitle')}
            features={GENERATOR_INCLUDED_KEYS.map((key) => tGenerator(`features.${key}`))}
            legal={tGenerator.rich('legal', {
              terms: (chunks) => <Link href="/terms">{chunks}</Link>,
            })}
            footer={
              <>
                {euRep.plan ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-medium">{t('generatorLine')}</p>
                        <p className="text-muted text-sm">
                          {additionalSites > 0
                            ? t('generatorLineDetailWithExtra', {
                                domain,
                                additional: additionalSites,
                              })
                            : t('generatorLineDetail', { domain })}
                        </p>
                      </div>
                      <p className="text-foreground shrink-0 text-sm font-medium">
                        {formatChf(generatorAmount)}
                      </p>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-medium">
                          {t('euRepLine', { plan: EU_REP_PLANS[euRep.plan].name })}
                        </p>
                        <p className="text-muted text-sm">{EU_REP_PLANS[euRep.plan].inquiry}</p>
                      </div>
                      <p className="text-foreground shrink-0 text-sm font-medium">
                        {formatChf(euRepAmount)}
                      </p>
                    </div>
                  </>
                ) : null}

                <div className="flex items-center justify-between gap-4">
                  <p className="text-foreground text-base font-semibold">{t('totalDue')}</p>
                  <p className="text-foreground shrink-0 text-xl font-bold">{formatChf(total)}</p>
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
                      {tPay('payCta')}
                      <CaretRight size={16} weight="bold" aria-hidden />
                    </>
                  )}
                </Button>
              </>
            }
          />
        </div>
      </Container>

      <StepFooter onBack={onBack} />
    </div>
  );
}
