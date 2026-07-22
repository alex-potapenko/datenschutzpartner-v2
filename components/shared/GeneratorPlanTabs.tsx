'use client';

import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { GENERATOR_PLAN_PRICES, type GeneratorPlanId } from '@/api/checkout';

const GENERATOR_PLAN_IDS: GeneratorPlanId[] = ['single', 'team', 'agency'];

type GeneratorPlanTabsProps = {
  value: GeneratorPlanId;
  onChange: (planId: GeneratorPlanId) => void;
  ariaLabel?: string;
};

export function GeneratorPlanTabs({ value, onChange, ariaLabel }: GeneratorPlanTabsProps) {
  const t = useTranslations('generatorPage.pricingSection.plans');
  const tCheckout = useTranslations('result.checkout');

  return (
    <Tabs
      selectedKey={value}
      onSelectionChange={(key) => {
        onChange(String(key) as GeneratorPlanId);
      }}
      className="w-full"
    >
      <Tabs.List aria-label={ariaLabel} className="grid w-full grid-cols-3 gap-2">
        {GENERATOR_PLAN_IDS.map((planId) => (
          <Tabs.Tab key={planId} id={planId} className="min-w-0 flex-1">
            <span className="truncate">{t(`${planId}.tabLabel`)}</span>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {GENERATOR_PLAN_IDS.map((planId) => (
        <Tabs.Panel key={planId} id={planId} className="pt-4">
          <PriceBlock
            currency="CHF"
            amount={GENERATOR_PLAN_PRICES[planId].toFixed(2)}
            notes={[tCheckout('renewalNote')]}
            size="sm"
          />
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

export { GENERATOR_PLAN_IDS };
