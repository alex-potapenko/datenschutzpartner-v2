'use client';

import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui';
import { PriceBlock } from '@/components/shared/PriceBlock';
import {
  GENERATOR_PLAN_IDS,
  GENERATOR_PLAN_PRICES,
  generatorPlanSiteCount,
  type GeneratorPlanId,
} from '@/api/checkout';

type GeneratorPlanTabsProps = {
  value: GeneratorPlanId;
  onChange: (planId: GeneratorPlanId) => void;
  ariaLabel?: string;
  /** When set, only these tiers are shown (e.g. upgrade targets). */
  visiblePlanIds?: GeneratorPlanId[];
};

export function GeneratorPlanTabs({
  value,
  onChange,
  ariaLabel,
  visiblePlanIds,
}: GeneratorPlanTabsProps) {
  const tPlans = useTranslations('generatorPage.pricingSection.plans');
  const tPricing = useTranslations('generatorPage.pricingSection');
  const tCheckout = useTranslations('result.checkout');
  const planIds = visiblePlanIds ?? GENERATOR_PLAN_IDS;
  const gridCols =
    planIds.length === 1 ? 'grid-cols-1' : planIds.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <Tabs
      selectedKey={value}
      onSelectionChange={(key) => {
        onChange(String(key) as GeneratorPlanId);
      }}
      className="w-full"
    >
      <Tabs.List aria-label={ariaLabel} className={`grid w-full gap-2 ${gridCols}`}>
        {planIds.map((planId) => (
          <Tabs.Tab key={planId} id={planId} className="min-w-0 flex-1">
            <span className="truncate">{tPlans(`${planId}.tabLabel`)}</span>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {planIds.map((planId) => (
        <Tabs.Panel key={planId} id={planId} className="pt-4">
          <PriceBlock
            currency="CHF"
            amount={GENERATOR_PLAN_PRICES[planId].toFixed(2)}
            notes={[
              tPricing('sitesIncluded', { count: generatorPlanSiteCount(planId) }),
              tCheckout('renewalNote'),
            ]}
            size="sm"
          />
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

export { GENERATOR_PLAN_IDS };
