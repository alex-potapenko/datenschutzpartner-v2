'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Lock, ShieldCheck, Spinner } from '@/components/ui';
import type { CheckoutCompleteResult } from '@/api/checkout';
import {
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  generatorPlanPrice,
  generatorPlanSiteCount,
  type GeneratorPlanId,
} from '@/api/checkout';
import { GeneratorPlanTabs } from '@/components/shared/GeneratorPlanTabs';
import { Container } from '@/components/shared/Container';
import { StepFooter } from '../ui/StepFooter';
import { StepHeader } from '../ui/StepHeader';
import { EU_REP_PLANS, type ImprovedFormData } from '../content/improved-form';
import type { EuRepState } from '../wizard-state';

interface PaymentStepProps {
  domain: string;
  formData: ImprovedFormData;
  euRep: EuRepState;
  onPaid: (result: CheckoutCompleteResult) => void;
  onBack: () => void;
}

interface LineItem {
  label: string;
  detail: string;
  amount: number;
}

function parsePrice(price: string): number {
  return Number(price.replace(/[^\d.]/g, '')) || 0;
}

function buildLineItems(domain: string, planId: GeneratorPlanId, euRep: EuRepState): LineItem[] {
  const siteCount = generatorPlanSiteCount(planId);
  const items: LineItem[] = [
    {
      label: 'Privacy Policy — annual subscription',
      detail: `Hosted policy for ${domain}, kept legally up to date · ${siteCount} ${
        siteCount === 1 ? 'site' : 'sites'
      }`,
      amount: generatorPlanPrice(planId),
    },
  ];

  if (euRep.plan) {
    const plan = EU_REP_PLANS[euRep.plan];
    items.push({
      label: `EU representation — ${plan.name} plan`,
      detail: `${plan.inquiry} · billed yearly`,
      amount: parsePrice(plan.price),
    });
  }

  return items;
}

function formatChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

export function PaymentStep({ domain, euRep, onPaid, onBack }: PaymentStepProps) {
  const t = useTranslations('result.checkout');
  const [planId, setPlanId] = useState<GeneratorPlanId>('team');
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();
  const isProcessing = createSession.isPending || completeSession.isPending;

  const items = buildLineItems(domain, planId, euRep);
  const total = items.reduce((sum, item) => sum + item.amount, 0);

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
    <>
      <StepHeader title={t('title')} description={<p>{t('description')}</p>} />

      <Container>
        <div className="border-border flex flex-col border-r border-l">
          <div className="border-border border-b px-4 py-5 sm:px-8">
            <p className="text-foreground mb-3 text-sm font-semibold">{t('selectPlan')}</p>
            <GeneratorPlanTabs value={planId} onChange={setPlanId} ariaLabel={t('selectPlan')} />
          </div>

          <div className="divide-border flex flex-col divide-y">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-4 px-4 py-5 sm:px-8"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-foreground text-base font-medium">{item.label}</p>
                  <p className="text-muted text-sm">{item.detail}</p>
                </div>
                <p className="text-foreground shrink-0 text-base font-semibold">
                  {formatChf(item.amount)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-border flex items-center justify-between gap-4 border-t px-4 py-5 sm:px-8">
            <div className="flex flex-col gap-0.5">
              <p className="text-foreground text-base font-semibold">{t('totalDue')}</p>
              <p className="text-muted text-sm">{t('renewalNote')}</p>
            </div>
            <p className="text-foreground shrink-0 text-xl font-bold">{formatChf(total)}</p>
          </div>

          <div className="border-border text-muted flex items-center gap-2 border-t px-4 py-4 text-sm sm:px-8">
            <Lock size={16} aria-hidden />
            <span>{t('payrexxNote')}</span>
          </div>

          <div className="border-border text-muted flex items-center gap-2 border-t px-4 py-4 text-sm sm:px-8">
            <ShieldCheck size={16} weight="fill" className="text-success" aria-hidden />
            <span>{t('legalReviewNote')}</span>
          </div>
        </div>
      </Container>

      <StepFooter
        onBack={onBack}
        onContinue={() => void handlePay()}
        ctaLabel={
          isProcessing ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" aria-hidden />
              {t('processing')}
            </span>
          ) : (
            t('payCta', { total: formatChf(total) })
          )
        }
        ctaDisabled={isProcessing}
      />
    </>
  );
}
