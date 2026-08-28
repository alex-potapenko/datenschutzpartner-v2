'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowsClockwise, Clock, Crosshair, Gavel } from '@/components/ui';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import {
  calculateGeneratorPolicyQuote,
  formatDiscountPercent,
  GENERATOR_POLICY_UNIT_PRICE,
} from '@/api/checkout';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { SiteQuantityStepper } from '@/components/shared/SiteQuantityStepper';

const INCLUDED_KEYS = [
  'services',
  'gdpr',
  'questions',
  'html',
  'fadp',
  'adjustments',
  'hosting',
  'pdf',
] as const;

const BENEFIT_KEYS = ['legallyReviewed', 'comprehensive', 'flexibleUse', 'longTerm'] as const;

type BenefitKey = (typeof BENEFIT_KEYS)[number];

const BENEFIT_ICONS: Record<BenefitKey, ReactNode> = {
  legallyReviewed: <Gavel size={24} weight="fill" aria-hidden />,
  comprehensive: <Crosshair size={24} weight="bold" aria-hidden />,
  flexibleUse: <ArrowsClockwise size={24} weight="bold" aria-hidden />,
  longTerm: <Clock size={24} weight="fill" aria-hidden />,
};

const BENEFIT_ICON_STYLES: Record<BenefitKey, { color: string; background: string }> = {
  legallyReviewed: {
    color: 'var(--feature-purple)',
    background: 'color-mix(in srgb, var(--feature-purple) 12%, transparent)',
  },
  comprehensive: {
    color: 'var(--feature-red)',
    background: 'color-mix(in srgb, var(--feature-red) 12%, transparent)',
  },
  flexibleUse: {
    color: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
  },
  longTerm: {
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 12%, transparent)',
  },
};

function BenefitIcon({ benefitKey }: { benefitKey: BenefitKey }) {
  const { color, background } = BENEFIT_ICON_STYLES[benefitKey];

  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-xl"
      style={{ background, color }}
    >
      {BENEFIT_ICONS[benefitKey]}
    </div>
  );
}

function formatChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

export function GeneratorBenefitsPanel() {
  const t = useTranslations('generatorPage');
  const tb = useTranslations('generatorPage.benefitsSection');
  const tp = useTranslations('generatorPage.pricingSection');

  const [siteCount, setSiteCount] = useState(1);
  const quote = useMemo(() => calculateGeneratorPolicyQuote(siteCount, siteCount), [siteCount]);

  const plans: EuRepPlan[] = [
    {
      id: 'policy',
      tabLabel: String(siteCount),
      showPerYear: false,
      price: quote.amountDue.toFixed(2),
      note:
        quote.discountRate > 0
          ? tp('discountApplied', { percent: formatDiscountPercent(quote.discountRate) })
          : tp('perSite', { price: formatChf(GENERATOR_POLICY_UNIT_PRICE) }),
    },
  ];

  return (
    <section id="plans" className="scroll-mt-24">
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <div id="what-you-get" className="flex h-full scroll-mt-24 flex-col">
          <div className="flex flex-col gap-3 p-4 sm:p-8">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {tb('title')}
            </h2>
          </div>

          <div className="flex max-w-xl flex-col gap-8 px-4 pb-10 sm:gap-10 sm:px-8 sm:pb-12">
            <p className="text-foreground text-base leading-relaxed">{tb('subtitle')}</p>

            <ul className="flex flex-col gap-8">
              {BENEFIT_KEYS.map((key) => (
                <li key={key} className="flex gap-4">
                  <BenefitIcon benefitKey={key} />
                  <div className="flex flex-col gap-1 pt-0.5">
                    <p className="text-foreground text-base font-semibold">
                      {tb(`items.${key}.title`)}
                    </p>
                    <p className="text-muted text-base leading-relaxed">
                      {tb(`items.${key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-muted text-sm leading-relaxed">
              {t.rich('faqNote', {
                faq: (chunks) => (
                  <NavigationLink href="/scan/faq" chevron="none" className="font-medium">
                    {chunks}
                  </NavigationLink>
                ),
              })}
            </p>
          </div>
        </div>

        <EuRepPlanCard
          plans={plans}
          defaultPlanId="policy"
          value="policy"
          pricePeriod={tp('pricePeriod')}
          showOrderCta={false}
          tabsAriaLabel={tp('siteCountLabel')}
          selectPlanTitle={tp('selectPlan')}
          includedTitle={tp('includedTitle')}
          selector={
            <SiteQuantityStepper
              value={siteCount}
              onChange={setSiteCount}
              decreaseLabel={tp('decreaseSites')}
              increaseLabel={tp('increaseSites')}
              valueLabel={tp('siteCountLabel')}
            />
          }
          features={INCLUDED_KEYS.map((key) => t(`features.${key}`))}
          legal={t.rich('legal', {
            terms: (chunks) => <Link href="/terms">{chunks}</Link>,
          })}
        />
      </div>

      <div
        aria-hidden
        className="border-border relative left-1/2 w-screen -translate-x-1/2 border-b"
      />
    </section>
  );
}
