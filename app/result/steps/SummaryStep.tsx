'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { countActivePolicySites, useSubscriptions } from '@/api/billing';
import type { CheckoutCompleteResult } from '@/api/checkout';
import {
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  calculateAmountInclVat,
  calculateEuRepQuote,
  calculateGeneratorPolicyQuote,
  calculateVatAmount,
  formatDiscountPercent,
  formatSwissVatPercent,
  GENERATOR_POLICY_UNIT_PRICE,
  POLICY_TRIAL_DAYS,
  qualifyingSiteCountForCheckout,
} from '@/api/checkout';
import { countAvailablePolicySlots, useDocuments } from '@/api/documents';
import { useEuRepContracts } from '@/api/eu-rep';
import { INSIGHT_META_VALUE_CLASS } from '@/app/insights/_components/insight-article-layout';
import { Timer } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { StepFooter } from '../ui/StepFooter';
import { StepFrame } from '../ui/StepFrame';
import { StepHeader } from '../ui/StepHeader';
import type { ImprovedFormData } from '../content/improved-form';
import { isBuyingEuRep, isLinkingExistingEuRep, type EuRepState } from '../wizard-state';

interface SummaryStepProps {
  domain: string;
  formData: ImprovedFormData;
  euRep: EuRepState;
  /** Prepaid slot on an existing subscription — no generator charge. */
  fillSubscriptionId?: string;
  onPaid: (result: CheckoutCompleteResult) => void;
  onBack: () => void;
}

function formatChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

function PriceRow({
  label,
  detail,
  amount,
  amountClassName = 'text-foreground',
}: {
  label: string;
  detail?: string;
  amount: string;
  amountClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-foreground text-sm font-normal">{label}</p>
        {detail ? <p className="text-muted text-sm font-normal">{detail}</p> : null}
      </div>
      <p className={`shrink-0 text-sm font-semibold ${amountClassName}`}>{amount}</p>
    </div>
  );
}

export function SummaryStep({
  domain,
  formData,
  euRep,
  fillSubscriptionId,
  onPaid,
  onBack,
}: SummaryStepProps) {
  const t = useTranslations('result.summary');
  const tValidation = useTranslations('validation');
  const tGenerator = useTranslations('generatorPage');
  const tp = useTranslations('generatorPage.pricingSection');
  const subscriptions = useSubscriptions();
  const documents = useDocuments();
  const euRepContracts = useEuRepContracts();
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();
  const isProcessing = createSession.isPending || completeSession.isPending;
  const linkedContract = euRepContracts.data?.find((row) => row.id === euRep.linkContractId);

  const buyingEuRep = isBuyingEuRep(euRep);
  const linkingExisting = isLinkingExistingEuRep(euRep);
  const legalEntity = euRep.legalEntity ?? formData.companyName;
  const forwardingEmail = euRep.forwardingEmail ?? formData.email;
  const activeSites = countActivePolicySites(subscriptions.data ?? []);

  const fillSubscription = useMemo(
    () =>
      fillSubscriptionId
        ? subscriptions.data?.find((row) => row.id === fillSubscriptionId)
        : undefined,
    [fillSubscriptionId, subscriptions.data]
  );

  const isFillSlotMode = Boolean(
    fillSubscriptionId &&
    fillSubscription &&
    documents.data &&
    countAvailablePolicySlots(fillSubscription, documents.data) > 0
  );

  const quote = useMemo(() => {
    if (isFillSlotMode) {
      return {
        siteCount: 1,
        qualifyingSiteCount: activeSites,
        unitPrice: GENERATOR_POLICY_UNIT_PRICE,
        discountRate: 0,
        listPrice: 0,
        discountAmount: 0,
        amountDue: 0,
      };
    }
    return calculateGeneratorPolicyQuote(
      qualifyingSiteCountForCheckout(activeSites, 'generator', 1),
      1
    );
  }, [activeSites, isFillSlotMode]);

  const euRepQuote = buyingEuRep ? calculateEuRepQuote(1) : null;
  const euRepAmount = euRepQuote?.amountDue ?? 0;
  const subtotalExclVat = quote.amountDue + euRepAmount;
  const vatAmount = calculateVatAmount(subtotalExclVat);
  const totalInclVat = calculateAmountInclVat(subtotalExclVat);
  const hasTrial = !isFillSlotMode;
  const dueToday = hasTrial ? 0 : totalInclVat;

  async function handleStart() {
    if (
      buyingEuRep &&
      (!legalEntity.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forwardingEmail.trim()))
    ) {
      toast.error(tValidation('required'));
      return;
    }

    try {
      if (!hasTrial) {
        toast.info(t('redirecting'));
      }

      const session = await createSession.mutateAsync({
        kind: 'generator',
        siteCount: 1,
        domain,
        policyName: 'Privacy Policy',
        legalEntity: formData.companyName.trim() || undefined,
        fillSubscriptionId: isFillSlotMode ? fillSubscriptionId : undefined,
        euRepEntityCount: buyingEuRep ? 1 : undefined,
        euRepEntities: buyingEuRep
          ? [{ legalEntity: legalEntity.trim(), forwardingEmail: forwardingEmail.trim() }]
          : undefined,
        euRepLinkContractId: linkingExisting ? euRep.linkContractId : undefined,
      });

      if (!hasTrial) {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      const result = await completeSession.mutateAsync(session.id);
      toast.success(hasTrial ? t('trialStarted') : t('paymentConfirmed'));
      onPaid(result);
    } catch {
      toast.error(hasTrial ? t('trialFailed') : t('paymentFailed'));
    }
  }

  const ctaLabel =
    isFillSlotMode && subtotalExclVat === 0 && !buyingEuRep
      ? t('publishCta')
      : hasTrial
        ? t('startTrialCta')
        : t('payCta');

  return (
    <StepFrame
      centerContent
      header={
        <StepHeader
          title={isFillSlotMode ? t('fillSlotTitle') : t('title')}
          description={
            isFillSlotMode ? (
              <p>{t('fillSlotDescription', { id: fillSubscriptionId ?? '' })}</p>
            ) : undefined
          }
        />
      }
      footer={
        <StepFooter
          onBack={onBack}
          onContinue={() => void handleStart()}
          ctaLabel={ctaLabel}
          ctaNote={hasTrial ? t('startTrialNote', { days: POLICY_TRIAL_DAYS }) : undefined}
          ctaDisabled={isProcessing}
        />
      }
    >
      <Container className="flex h-full flex-1 flex-col overflow-visible">
        <div className="border-border flex h-full flex-1 flex-col overflow-visible border-r border-l">
          <div className="flex h-full flex-1 flex-col px-4 pt-10 pb-10 sm:px-8 sm:pt-16">
            <div className="flex w-full max-w-2xl flex-col items-start gap-8 text-left">
              {hasTrial ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Timer size={24} weight="fill" className="text-accent shrink-0" aria-hidden />
                    <span className="font-display text-accent text-base font-medium">
                      {t('trialLabel')}
                    </span>
                  </div>
                  <p className={`${INSIGHT_META_VALUE_CLASS} leading-relaxed`}>
                    {t('trialBody', { days: POLICY_TRIAL_DAYS })}
                  </p>
                </div>
              ) : null}

              <div className="flex w-full flex-col gap-4">
                {isFillSlotMode ? (
                  <p className="text-muted text-sm">
                    {t('slotIncluded', { id: fillSubscriptionId ?? '' })}
                  </p>
                ) : null}

                <PriceRow
                  label={t('generatorLine')}
                  detail={
                    isFillSlotMode
                      ? t('generatorLineSlotDetail', { id: fillSubscriptionId ?? '', domain })
                      : t('generatorLineDetail', { domain })
                  }
                  amount={formatChf(quote.amountDue)}
                />

                {!isFillSlotMode && quote.discountAmount > 0 ? (
                  <PriceRow
                    label={t('discountLine', {
                      percent: formatDiscountPercent(quote.discountRate),
                    })}
                    amount={`− ${formatChf(quote.discountAmount)}`}
                    amountClassName="text-success"
                  />
                ) : !isFillSlotMode ? (
                  <p className="text-muted text-sm">
                    {tp('perSite', { price: formatChf(GENERATOR_POLICY_UNIT_PRICE) })}
                  </p>
                ) : null}

                {buyingEuRep ? (
                  <PriceRow
                    label={t('euRepLine')}
                    detail={t('euRepLineDetailNamed', { entity: legalEntity.trim() || '—' })}
                    amount={formatChf(euRepAmount)}
                  />
                ) : null}

                {linkingExisting ? (
                  <PriceRow
                    label={t('euRepLinkLine')}
                    detail={t('euRepLinkLineDetail', {
                      entity: linkedContract?.legalEntity ?? '—',
                    })}
                    amount={formatChf(0)}
                  />
                ) : null}

                <div className="border-border flex flex-col gap-3 border-t pt-4">
                  <PriceRow label={t('subtotalExclVat')} amount={formatChf(subtotalExclVat)} />
                  <PriceRow
                    label={t('vatLine', { rate: formatSwissVatPercent() })}
                    amount={formatChf(vatAmount)}
                  />
                  <PriceRow label={t('totalInclVat')} amount={formatChf(totalInclVat)} />
                  <PriceRow label={t('dueToday')} amount={formatChf(dueToday)} />
                </div>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                {tGenerator.rich('legal', {
                  terms: (chunks) => <Link href="/terms">{chunks}</Link>,
                })}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </StepFrame>
  );
}
