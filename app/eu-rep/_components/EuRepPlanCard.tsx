'use client';

import { useState, type Key } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, CaretRight, Check, Tabs } from '@/components/ui';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { AnimatedRollingNumber } from '@/components/shared/AnimatedRollingNumber';

const MEMBERSHIP_CARD_STYLE = {
  border: '2px solid rgba(255,255,255,1)',
  background: 'rgba(255,255,255,0.6)',
  boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
} as const;

const ROLLING_AMOUNT_CLASS =
  'font-display text-foreground text-2xl leading-none font-bold tracking-tight tabular-nums';

export type EuRepInquiryAllowance = {
  includedCount: string;
  includedLabel: string;
  furtherAmount: string;
  furtherLabel: string;
};

export type EuRepPlan = {
  id: string;
  tabLabel: string;
  showPerYear: boolean;
  note?: string;
  inquiryAllowance?: EuRepInquiryAllowance;
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
  orderHref?: string;
};

type EuRepPlanPanelContentProps = {
  plan: EuRepPlan;
  pricePeriod: string;
  orderCta: string;
  onChoose?: (planId: string) => void;
  chooseLabels?: Partial<Record<string, string>>;
  orderHref: string;
};

const REVEAL_TRANSITION = { duration: 0.25, ease: 'easeInOut' as const };

function RevealSection({
  show,
  children,
  sectionKey,
}: {
  show: boolean;
  children: React.ReactNode;
  sectionKey: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          key={sectionKey}
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
          transition={reduceMotion ? { duration: 0 } : REVEAL_TRANSITION}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function EuRepPlanPanelContent({
  plan,
  pricePeriod,
  orderCta,
  onChoose,
  chooseLabels,
  orderHref,
}: EuRepPlanPanelContentProps) {
  const reduceMotion = useReducedMotion();
  const priceValue = Number(plan.price);
  const includedCountValue = plan.inquiryAllowance
    ? Number(plan.inquiryAllowance.includedCount)
    : undefined;
  const furtherAmountValue = plan.inquiryAllowance
    ? Number(plan.inquiryAllowance.furtherAmount)
    : undefined;
  const showInquiryAllowance =
    plan.inquiryAllowance !== undefined &&
    includedCountValue !== undefined &&
    furtherAmountValue !== undefined;

  const orderButton = onChoose ? (
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
      href={orderHref}
      className="font-display inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-medium text-white transition-opacity hover:opacity-90"
      style={{ background: 'var(--accent)' }}
    >
      {orderCta}
      <CaretRight size={16} weight="bold" aria-hidden />
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <PriceBlock
          currency="CHF"
          amount={plan.price}
          animatedAmount={Number.isFinite(priceValue) ? priceValue : undefined}
          notes={[plan.showPerYear ? pricePeriod : null, plan.note]}
        />
        <RevealSection show={showInquiryAllowance} sectionKey="inquiry-allowance">
          <div className="border-border flex items-stretch overflow-hidden rounded-xl border">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-5 py-4">
              <AnimatedRollingNumber
                value={includedCountValue ?? 0}
                className={ROLLING_AMOUNT_CLASS}
              />
              <span className="text-muted text-sm leading-snug">
                {plan.inquiryAllowance?.includedLabel}
              </span>
            </div>

            <div className="bg-border w-px shrink-0 self-stretch" aria-hidden />

            <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-5 py-4">
              <p className="flex flex-nowrap items-end gap-1.5 whitespace-nowrap">
                <span className="font-display text-foreground pb-0.5 text-sm leading-none font-bold">
                  CHF
                </span>
                <AnimatedRollingNumber
                  value={furtherAmountValue ?? 0}
                  className={ROLLING_AMOUNT_CLASS}
                />
              </p>
              <span className="text-muted text-sm leading-snug">
                {plan.inquiryAllowance?.furtherLabel}
              </span>
            </div>
          </div>
        </RevealSection>
      </div>
      <motion.div
        key={showInquiryAllowance ? 'order-with-inquiry' : 'order-budget'}
        layout={!reduceMotion}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: 0.22,
                ease: 'easeOut',
                layout: REVEAL_TRANSITION,
              }
        }
      >
        {orderButton}
      </motion.div>
    </div>
  );
}

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
  orderHref = '#',
}: EuRepPlanCardProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];

  if (!selectedPlan) return null;

  return (
    <div className="border-border relative flex min-h-full items-start justify-center overflow-visible border-t px-4 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:border-l lg:px-16 lg:py-12">
      <HeroGlowOrbs />

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-4">
        <div className="squircle w-full overflow-hidden" style={MEMBERSHIP_CARD_STYLE}>
          <div className="flex flex-col gap-6 p-4 sm:p-8">
            <h2 className="text-foreground text-center text-xl font-semibold">{selectPlanTitle}</h2>

            <Tabs
              selectedKey={selectedPlanId}
              onSelectionChange={(key: Key) => {
                setSelectedPlanId(String(key));
              }}
              className="!gap-6"
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label={tabsAriaLabel} className="!w-full">
                  {plans.map((plan) => (
                    <Tabs.Tab key={plan.id} id={plan.id} className="!flex-1 justify-center">
                      <span className="text-base font-medium whitespace-nowrap">
                        {plan.tabLabel}
                      </span>
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>

              <EuRepPlanPanelContent
                plan={selectedPlan}
                pricePeriod={pricePeriod}
                orderCta={orderCta}
                onChoose={onChoose}
                chooseLabels={chooseLabels}
                orderHref={orderHref}
              />
            </Tabs>

            <div className="border-border flex flex-col gap-4 border-t pt-6">
              <p className="text-foreground text-base font-semibold">{includedTitle}</p>
              <ul className="flex flex-col gap-2.5">
                {features.map((label) => (
                  <li
                    key={label}
                    className="text-foreground flex items-start gap-2.5 text-sm leading-snug"
                  >
                    <Check
                      size={16}
                      weight="bold"
                      className="text-success mt-0.5 shrink-0"
                      aria-hidden
                    />
                    {label}
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
