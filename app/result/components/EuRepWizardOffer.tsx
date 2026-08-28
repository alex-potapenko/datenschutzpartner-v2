'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { calculateEuRepQuote } from '@/api/checkout';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import { EuRepContractFields } from '@/components/shared/EuRepContractFields';
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
  legalEntity: string;
  forwardingEmail: string;
  onLegalEntityChange: (value: string) => void;
  onForwardingEmailChange: (value: string) => void;
  legalEntityError?: string;
  forwardingEmailError?: string;
};

export function EuRepWizardOffer({
  legalEntity,
  forwardingEmail,
  onLegalEntityChange,
  onForwardingEmailChange,
  legalEntityError,
  forwardingEmailError,
}: EuRepWizardOfferProps) {
  const t = useTranslations('euRepPage');
  const tp = useTranslations('euRepPage.pricingSection');
  const quote = useMemo(() => calculateEuRepQuote(1), []);

  const plans: EuRepPlan[] = [
    {
      id: 'single',
      tabLabel: '1',
      showPerYear: true,
      price: quote.amountDue.toFixed(2),
    },
  ];

  return (
    <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
      <EuRepWizardBenefitsPanel />

      <EuRepPlanCard
        plans={plans}
        defaultPlanId="single"
        value="single"
        pricePeriod={t('pricePeriod')}
        priceAlign="center"
        showPlanPricing
        showOrderCta={false}
        tabsAriaLabel={tp('entityCountLabel')}
        selectPlanTitle={tp('selectOne')}
        includedTitle={tp('includedToggle')}
        featuresCollapsible
        features={INCLUDED_KEYS.map((key) => t(`features.${key}`))}
        legal={t.rich('legal', {
          terms: (chunks) => <Link href="/terms">{chunks}</Link>,
        })}
        footerSectionClassName=""
        footerClassName="flex flex-col gap-3"
        footer={
          <div className="rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]">
            <EuRepContractFields
              idPrefix="wizard-eu-rep"
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
  );
}
