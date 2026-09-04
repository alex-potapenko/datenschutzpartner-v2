'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { calculateEuRepQuote, EU_REP_PLANS, type EuRepPlanId } from '@/api/checkout';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import {
  EuRepContractFields,
  type EuRepPostalFields,
} from '@/components/shared/EuRepContractFields';
import { ServiceCheckoutLayout } from '@/components/shared/ServiceCheckoutLayout';
import { ServiceCheckoutPlanCard } from '@/components/shared/ServiceCheckoutPlanCard';
import type { EuRepOfferVariant } from '../wizard-state';
import { EuRepWizardBenefitsPanel } from './EuRepWizardBenefitsPanel';

const INCLUDED_KEYS = [
  'establishment',
  'art27',
  'mentionPolicy',
  'mentionRecords',
  'email',
  'post',
  'newsletter',
  'podcast',
] as const;

type EuRepWizardOfferProps = {
  variant: EuRepOfferVariant;
  selected: boolean;
  onSelectedChange: (value: boolean) => void;
  legalEntity: string;
  forwardingEmail: string;
  onLegalEntityChange: (value: string) => void;
  onForwardingEmailChange: (value: string) => void;
  legalEntityError?: string;
  forwardingEmailError?: string;
  postal: EuRepPostalFields;
  onPostalChange: (patch: Partial<EuRepPostalFields>) => void;
  postalErrors?: Partial<Record<keyof EuRepPostalFields, string>>;
  selectedPlanId: EuRepPlanId;
  onPlanChange: (planId: EuRepPlanId) => void;
};

function isEuRepPlanId(value: string): value is EuRepPlanId {
  return value === 'basis' || value === 'plus' || value === 'plus5';
}

export function EuRepWizardOffer({
  variant,
  selected,
  onSelectedChange,
  legalEntity,
  forwardingEmail,
  onLegalEntityChange,
  onForwardingEmailChange,
  legalEntityError,
  forwardingEmailError,
  postal,
  onPostalChange,
  postalErrors,
  selectedPlanId,
  onPlanChange,
}: EuRepWizardOfferProps) {
  const t = useTranslations('euRepPage');
  const tw = useTranslations('result.euRepStep');
  const tp = useTranslations('euRepPage.pricingSection');
  const quote = useMemo(() => calculateEuRepQuote(selectedPlanId), [selectedPlanId]);

  const checkoutPlans: EuRepPlan[] = useMemo(
    () =>
      EU_REP_PLANS.map((row) => ({
        id: row.id,
        tabLabel: t(`plans.${row.id}.name`),
        showPerYear: true,
        price: calculateEuRepQuote(row.id).amountDue.toFixed(2),
      })),
    [t]
  );

  const features = INCLUDED_KEYS.map((key) => t(`features.${key}`));
  const legalCheckout = t.rich('legalCheckout', {
    terms: (chunks) => <Link href="/terms">{chunks}</Link>,
  });
  const legal = t.rich('legal', {
    terms: (chunks) => <Link href="/terms">{chunks}</Link>,
  });

  if (variant === 'new') {
    return (
      <ServiceCheckoutLayout
        embedded
        aside={
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="text-foreground text-xl font-bold sm:text-2xl">
                {tw('offerTitleNew')}
              </h2>
              <p className="text-foreground text-base leading-relaxed">{tw('offerNewBody')}</p>
            </div>

            <EuRepContractFields
              idPrefix="wizard-eu-rep"
              legalEntity={legalEntity}
              forwardingEmail={forwardingEmail}
              onLegalEntityChange={onLegalEntityChange}
              onForwardingEmailChange={onForwardingEmailChange}
              legalEntityError={legalEntityError}
              forwardingEmailError={forwardingEmailError}
              postal={postal}
              onPostalChange={onPostalChange}
              postalErrors={postalErrors}
            />
          </div>
        }
      >
        <ServiceCheckoutPlanCard
          plans={checkoutPlans}
          selectedPlanId={selectedPlanId}
          onPlanChange={(planId) => {
            if (isEuRepPlanId(planId)) onPlanChange(planId);
          }}
          pricePeriod={t('pricePeriod')}
          tabsAriaLabel={tp('entityCountLabel')}
          selectPlanTitle={tp('chosenPlan')}
          includedTitle={tp('includedToggle')}
          features={features}
          legal={legalCheckout}
          subtotalExclVat={quote.amountDue}
        />
      </ServiceCheckoutLayout>
    );
  }

  const showOfferContent = selected;

  return (
    <div className="flex flex-col gap-8">
      {showOfferContent ? (
        <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
          <EuRepWizardBenefitsPanel />

          <EuRepPlanCard
            plans={checkoutPlans}
            defaultPlanId={selectedPlanId}
            value={selectedPlanId}
            onPlanChange={(planId) => {
              if (isEuRepPlanId(planId)) onPlanChange(planId);
            }}
            pricePeriod={t('pricePeriod')}
            priceAlign="center"
            showPlanPricing
            showOrderCta={false}
            tabsAriaLabel={tp('entityCountLabel')}
            selectPlanTitle={tp('chosenPlan')}
            includedTitle={tp('includedToggle')}
            featuresCollapsible
            features={features}
            legal={legal}
            footerSectionClassName=""
            footerClassName="flex flex-col gap-3"
            footer={
              <div className="rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]">
                <EuRepContractFields
                  idPrefix="wizard-eu-rep-switch"
                  legalEntity={legalEntity}
                  forwardingEmail={forwardingEmail}
                  onLegalEntityChange={onLegalEntityChange}
                  onForwardingEmailChange={onForwardingEmailChange}
                  legalEntityError={legalEntityError}
                  forwardingEmailError={forwardingEmailError}
                />
              </div>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
