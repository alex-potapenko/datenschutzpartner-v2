'use client';

import { useCallback, useState, type Key } from 'react';
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
  orderCta?: string;
  tabsAriaLabel: string;
  selectPlanTitle: string;
  includedTitle: string;
  features: string[];
  legal?: React.ReactNode;
  onChoose?: (planId: string) => void;
  chooseLabels?: Partial<Record<string, string>>;
  orderHref?: string;
  showOrderCta?: boolean;
  value?: string;
  onPlanChange?: (planId: string) => void;
  layout?: 'sidebar' | 'standalone';
  footer?: React.ReactNode;
  showGlow?: boolean;
  /** Stretch the card area to fill available height (wizard checkout). */
  fillHeight?: boolean;
};

type EuRepPlanPanelContentProps = {
  plan: EuRepPlan;
  pricePeriod: string;
  orderCta?: string;
  onChoose?: (planId: string) => void;
  chooseLabels?: Partial<Record<string, string>>;
  orderHref?: string;
  showOrderCta?: boolean;
};

const SLIDE_TRANSITION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const };
const HEIGHT_TRANSITION = { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const };
const SLIDE_OFFSET = 32;

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({ x: direction * SLIDE_OFFSET, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -SLIDE_OFFSET, opacity: 0 }),
};

/**
 * Cross-fades keyed content with a directional slide while interpolating the
 * container height. The outgoing panel is popped out of layout flow so the
 * height is driven solely by the measured incoming panel.
 */
function SlidingPanel({
  panelKey,
  direction,
  className,
  alwaysVisibleOverflow = false,
  children,
}: {
  panelKey: string;
  direction: number;
  className?: string;
  /** Keeps overflow visible even mid-animation (e.g. footers with a CTA button). */
  alwaysVisibleOverflow?: boolean;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [isSettled, setIsSettled] = useState(true);

  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return undefined;

    const observer = new ResizeObserver(() => {
      setHeight(node.offsetHeight);
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ height }}
      transition={HEIGHT_TRANSITION}
      onAnimationStart={() => {
        setIsSettled(false);
      }}
      onAnimationComplete={() => {
        setIsSettled(true);
        // Release the measured height so the panel can never clip its content
        // once it has settled (focus rings, font swaps, sub-pixel rounding).
        setHeight('auto');
      }}
      style={{
        position: 'relative',
        overflow: alwaysVisibleOverflow || isSettled ? 'visible' : 'hidden',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={panelKey}
          custom={direction}
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_TRANSITION}
        >
          <div ref={measureRef}>{children}</div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function EuRepPlanPanelContent({
  plan,
  pricePeriod,
  orderCta = '',
  onChoose,
  chooseLabels,
  orderHref = '#',
  showOrderCta = true,
}: EuRepPlanPanelContentProps) {
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
      <PriceBlock
        currency="CHF"
        amount={plan.price}
        animatedAmount={Number.isFinite(priceValue) ? priceValue : undefined}
        notes={[plan.showPerYear ? pricePeriod : null, plan.note]}
      />

      {showInquiryAllowance ? (
        <div className="border-border flex items-stretch overflow-hidden rounded-xl border">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-5 py-4">
            <AnimatedRollingNumber value={includedCountValue} className={ROLLING_AMOUNT_CLASS} />
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
              <AnimatedRollingNumber value={furtherAmountValue} className={ROLLING_AMOUNT_CLASS} />
            </p>
            <span className="text-muted text-sm leading-snug">
              {plan.inquiryAllowance?.furtherLabel}
            </span>
          </div>
        </div>
      ) : null}

      {showOrderCta ? orderButton : null}
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
  orderHref,
  showOrderCta = true,
  value,
  onPlanChange,
  layout = 'sidebar',
  footer,
  showGlow = true,
  fillHeight = false,
}: EuRepPlanCardProps) {
  const [internalPlanId, setInternalPlanId] = useState(defaultPlanId);
  const [lastDefaultPlanId, setLastDefaultPlanId] = useState(defaultPlanId);
  const [direction, setDirection] = useState(1);
  if (value === undefined && defaultPlanId !== lastDefaultPlanId) {
    setLastDefaultPlanId(defaultPlanId);
    setInternalPlanId(defaultPlanId);
  }
  const selectedPlanId = value ?? internalPlanId;
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];

  if (!selectedPlan) return null;

  const outerClassName =
    layout === 'standalone'
      ? `flex justify-center overflow-visible px-4 py-8 sm:px-8 sm:py-10${fillHeight ? ' min-h-0 flex-1' : ''}`
      : 'border-border flex min-h-full items-start justify-center overflow-visible border-t px-4 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:border-l lg:px-16 lg:py-12';

  function handlePlanChange(planId: string) {
    const currentIndex = plans.findIndex((plan) => plan.id === selectedPlanId);
    const nextIndex = plans.findIndex((plan) => plan.id === planId);
    if (currentIndex !== -1 && nextIndex !== -1 && currentIndex !== nextIndex) {
      setDirection(nextIndex > currentIndex ? 1 : -1);
    }

    if (value === undefined) {
      setInternalPlanId(planId);
    }
    onPlanChange?.(planId);
  }

  return (
    <div className={outerClassName}>
      <div className="relative flex w-full max-w-[440px] flex-col gap-4 overflow-visible">
        {showGlow ? <HeroGlowOrbs /> : null}

        <div className="relative z-10 flex w-full flex-col gap-4">
          <div className="squircle w-full overflow-hidden" style={MEMBERSHIP_CARD_STYLE}>
            <div className="flex flex-col gap-6 p-4 sm:p-8">
              <h2 className="text-foreground text-center text-xl font-semibold">
                {selectPlanTitle}
              </h2>

              <Tabs
                selectedKey={selectedPlanId}
                onSelectionChange={(key: Key) => {
                  handlePlanChange(String(key));
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

                <SlidingPanel panelKey={selectedPlanId} direction={direction}>
                  <EuRepPlanPanelContent
                    plan={selectedPlan}
                    pricePeriod={pricePeriod}
                    orderCta={orderCta}
                    onChoose={onChoose}
                    chooseLabels={chooseLabels}
                    orderHref={orderHref}
                    showOrderCta={showOrderCta}
                  />
                </SlidingPanel>
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

              {footer ? (
                <SlidingPanel
                  panelKey={selectedPlanId}
                  direction={direction}
                  className="border-border border-t"
                  alwaysVisibleOverflow
                >
                  <div className="flex flex-col gap-4 pt-6">{footer}</div>
                </SlidingPanel>
              ) : null}
            </div>
          </div>

          {legal ? <p className="text-muted text-center text-xs leading-relaxed">{legal}</p> : null}
        </div>
      </div>
    </div>
  );
}
