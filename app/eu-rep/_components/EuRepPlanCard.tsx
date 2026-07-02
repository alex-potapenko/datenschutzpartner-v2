'use client';

import Link from 'next/link';
import { Button, CaretRight, CheckCircle, Tabs } from '@/components/ui';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { PriceBlock } from '@/components/shared/PriceBlock';

const MEMBERSHIP_CARD_STYLE = {
  border: '2px solid rgba(255,255,255,1)',
  background: 'rgba(255,255,255,0.6)',
  boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
} as const;

export type EuRepPlan = {
  id: string;
  tabLabel: string;
  showPerYear: boolean;
  note?: string;
  price: string;
};

type EuRepPlanCardProps = {
  plans: EuRepPlan[];
  defaultPlanId: string;
  pricePeriod: string;
  orderCta: string;
  tabsAriaLabel: string;
  selectPlanTitle: string;
  includedTitle: string;
  features: string[];
  legal: React.ReactNode;
  onChoose?: (planId: string) => void;
  chooseLabels?: Partial<Record<string, string>>;
};

export function EuRepPlanCard({
  plans,
  defaultPlanId,
  pricePeriod,
  orderCta,
  tabsAriaLabel,
  selectPlanTitle,
  includedTitle,
  features,
  legal,
  onChoose,
  chooseLabels,
}: EuRepPlanCardProps) {
  return (
    <div className="border-border relative flex min-h-full items-start justify-center overflow-visible border-t px-4 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:border-l lg:px-16 lg:py-12">
      <HeroGlowOrbs />

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-4">
        <div className="squircle w-full overflow-hidden" style={MEMBERSHIP_CARD_STYLE}>
          <div className="flex flex-col gap-6 p-4 sm:p-8">
            <h2 className="text-foreground text-center text-xl font-semibold">{selectPlanTitle}</h2>

            <Tabs defaultSelectedKey={defaultPlanId} className="!gap-6">
              <Tabs.ListContainer>
                <Tabs.List aria-label={tabsAriaLabel} className="!w-full">
                  {plans.map((plan) => (
                    <Tabs.Tab key={plan.id} id={plan.id} className="!flex-1 justify-center">
                      <span className="font-display text-sm font-medium whitespace-nowrap">
                        {plan.tabLabel}
                      </span>
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>

              {plans.map((plan) => (
                <Tabs.Panel key={plan.id} id={plan.id} className="!mt-0 !p-0">
                  <div className="flex flex-col gap-6">
                    <PriceBlock
                      currency="CHF"
                      amount={plan.price}
                      notes={[plan.showPerYear ? pricePeriod : null, plan.note]}
                    />
                    {onChoose ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        className="font-display h-14 w-full gap-2 rounded-full text-base"
                        onPress={() => {
                          onChoose(plan.id);
                        }}
                      >
                        {chooseLabels?.[plan.id] ?? orderCta}
                        <CaretRight size={16} weight="bold" aria-hidden />
                      </Button>
                    ) : (
                      <Link
                        href="#"
                        className="font-display inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-medium text-white transition-opacity hover:opacity-90"
                        style={{ background: 'var(--accent)' }}
                      >
                        {orderCta}
                        <CaretRight size={16} weight="bold" aria-hidden />
                      </Link>
                    )}
                  </div>
                </Tabs.Panel>
              ))}
            </Tabs>

            <div className="border-border flex flex-col gap-4 border-t pt-6">
              <p className="text-foreground text-base font-semibold">{includedTitle}</p>
              <ul className="flex flex-col gap-2.5">
                {features.map((label) => (
                  <li
                    key={label}
                    className="text-foreground flex items-start gap-2.5 text-sm leading-snug"
                  >
                    <CheckCircle
                      size={16}
                      weight="fill"
                      className="mt-0.5 shrink-0"
                      style={{ color: '#22c55e' }}
                      aria-hidden
                    />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="text-muted text-center text-xs leading-relaxed">{legal}</p>
      </div>
    </div>
  );
}
