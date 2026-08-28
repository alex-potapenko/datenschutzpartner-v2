'use client';

import { useCallback, useId, useState, type Key } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, CaretDown, CaretRight, Check, Tabs } from '@/components/ui';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { PriceBlock, priceBlockAmountClassName } from '@/components/shared/PriceBlock';

const MEMBERSHIP_CARD_STYLE = {
  border: '2px solid rgba(255,255,255,1)',
  background: 'rgba(255,255,255,0.6)',
  boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
} as const;

export type EuRepPlan = {
  id: string;
  tabLabel: string;
  showPerYear: boolean;
  note?: React.ReactNode;
  noteClassName?: string;
  price: string;
  /** List price before volume discount — shown struck through next to `price`. */
  listPrice?: string;
};

type EuRepPlanCardProps = {
  plans: EuRepPlan[];
  defaultPlanId: string;
  pricePeriod: string;
  orderCta?: string;
  tabsAriaLabel: string;
  selectPlanTitle: string;
  /** Hide the plan title above the card content. */
  showPlanTitle?: boolean;
  includedTitle: string;
  features: string[];
  /** Collapse the included-features list behind the title. */
  featuresCollapsible?: boolean;
  legal?: React.ReactNode;
  onChoose?: (planId: string) => void;
  chooseLabels?: Partial<Record<string, string>>;
  orderHref?: string;
  showOrderCta?: boolean;
  value?: string;
  onPlanChange?: (planId: string) => void;
  layout?: 'sidebar' | 'standalone';
  footer?: React.ReactNode;
  /** Rendered after the included-features block (e.g. order total). */
  postFeaturesFooter?: React.ReactNode;
  postFeaturesFooterClassName?: string;
  /** Primary action rendered outside the footer flex stack (e.g. pay CTA). */
  footerAction?: React.ReactNode;
  footerSectionClassName?: string;
  footerClassName?: string;
  showGlow?: boolean;
  /** Stretch the card area to fill available height (wizard checkout). */
  fillHeight?: boolean;
  /** Replaces the plan tabs — used for site-quantity checkout. */
  selector?: React.ReactNode;
  /** Hide the plan price block (e.g. checkout shows total in the footer). */
  showPlanPricing?: boolean;
  priceAlign?: 'start' | 'center';
  /** Renders above the plan title (e.g. new vs. existing tabs). */
  topTabs?: React.ReactNode;
  /** Icon rendered above the plan title — e.g. a success checkmark. */
  planTitleIcon?: React.ReactNode;
};

type EuRepPlanPanelContentProps = {
  plan: EuRepPlan;
  pricePeriod: string;
  orderCta?: string;
  onChoose?: (planId: string) => void;
  chooseLabels?: Partial<Record<string, string>>;
  orderHref?: string;
  showOrderCta?: boolean;
  showPlanPricing?: boolean;
  priceAlign?: 'start' | 'center';
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
  showPlanPricing = true,
  priceAlign = 'start',
}: EuRepPlanPanelContentProps) {
  const priceValue = Number(plan.price);
  const listPriceValue = plan.listPrice ? Number(plan.listPrice) : NaN;
  const hasDiscount =
    Number.isFinite(listPriceValue) && Number.isFinite(priceValue) && listPriceValue > priceValue;

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
      {showPlanPricing || plan.note ? (
        <div
          className={`flex flex-col gap-2${priceAlign === 'center' ? 'items-center text-center' : ''}`}
        >
          {showPlanPricing ? (
            hasDiscount ? (
              <div className="flex flex-wrap items-end justify-center gap-2">
                <span className="font-display text-foreground pb-0.75 text-lg leading-none font-bold">
                  CHF
                </span>
                <span
                  className={`${priceBlockAmountClassName()} text-muted/70 line-through decoration-from-font`}
                >
                  {plan.listPrice}
                </span>
                <span className={`${priceBlockAmountClassName()} text-danger`}>{plan.price}</span>
                {plan.showPerYear ? (
                  <span className="text-muted pb-1 text-sm leading-snug whitespace-nowrap">
                    {pricePeriod}
                  </span>
                ) : null}
              </div>
            ) : (
              <PriceBlock
                currency="CHF"
                amount={plan.price}
                animatedAmount={Number.isFinite(priceValue) ? priceValue : undefined}
                notes={[plan.showPerYear ? pricePeriod : null]}
                align={priceAlign}
              />
            )
          ) : null}
          {plan.note ? (
            <div className={plan.noteClassName ?? 'text-muted text-sm leading-snug'}>
              {plan.note}
            </div>
          ) : null}
        </div>
      ) : null}

      {showOrderCta ? orderButton : null}
    </div>
  );
}

function IncludedFeatures({
  title,
  features,
  collapsible,
}: {
  title: string;
  features: string[];
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  const listId = useId();

  const list = (
    <ul id={collapsible ? listId : undefined} className="flex flex-col gap-2.5">
      {features.map((label) => (
        <li key={label} className="text-foreground flex items-start gap-2.5 text-sm leading-snug">
          <Check size={16} weight="bold" className="text-success mt-0.5 shrink-0" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );

  if (!collapsible) {
    return (
      <div className="border-border flex flex-col gap-4 border-t pt-6">
        <p className="text-foreground text-base font-semibold">{title}</p>
        {list}
      </div>
    );
  }

  return (
    <div className="border-border flex flex-col border-t pt-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
      >
        <span className="text-accent text-base font-semibold">{title}</span>
        <CaretDown
          size={16}
          weight="bold"
          aria-hidden
          className={`text-accent shrink-0 transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid min-h-0 transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-4">{list}</div>
        </div>
      </div>
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
  showPlanTitle = true,
  includedTitle,
  features,
  featuresCollapsible = false,
  legal,
  onChoose,
  chooseLabels,
  orderHref,
  showOrderCta = true,
  value,
  onPlanChange,
  layout = 'sidebar',
  footer,
  postFeaturesFooter,
  postFeaturesFooterClassName = 'flex flex-col gap-3',
  footerAction,
  footerSectionClassName = 'border-border border-t',
  footerClassName = 'flex flex-col gap-3 pt-6',
  showGlow = true,
  fillHeight = false,
  selector,
  showPlanPricing = true,
  priceAlign = 'start',
  topTabs,
  planTitleIcon,
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

  const showPlanTabs = plans.length > 1 && !selector;
  const showPlanPanel = selector || showPlanTabs || showPlanPricing || Boolean(selectedPlan.note);

  const planPanelProps = {
    plan: selectedPlan,
    pricePeriod,
    orderCta,
    onChoose,
    chooseLabels,
    orderHref,
    showOrderCta,
    showPlanPricing,
    priceAlign,
  };

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
              {showPlanTitle ? (
                planTitleIcon ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    {planTitleIcon}
                    <h2 className="text-foreground text-xl font-semibold">{selectPlanTitle}</h2>
                  </div>
                ) : (
                  <h2 className="text-foreground text-center text-xl font-semibold">
                    {selectPlanTitle}
                  </h2>
                )
              ) : null}

              {topTabs ? <div className="-mt-2">{topTabs}</div> : null}

              {selector ? (
                <div className="flex flex-col gap-6">
                  {selector}
                  {showPlanPanel ? <EuRepPlanPanelContent {...planPanelProps} /> : null}
                </div>
              ) : showPlanTabs ? (
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
                    <EuRepPlanPanelContent {...planPanelProps} />
                  </SlidingPanel>
                </Tabs>
              ) : showPlanPanel ? (
                <EuRepPlanPanelContent {...planPanelProps} />
              ) : null}

              {footer ? (
                <SlidingPanel
                  panelKey={selectedPlanId}
                  direction={direction}
                  className={footerSectionClassName || undefined}
                  alwaysVisibleOverflow
                >
                  <div className={footerClassName}>{footer}</div>
                </SlidingPanel>
              ) : null}

              {features.length > 0 ? (
                <IncludedFeatures
                  title={includedTitle}
                  features={features}
                  collapsible={featuresCollapsible}
                />
              ) : null}

              {postFeaturesFooter ? (
                <div className={postFeaturesFooterClassName}>{postFeaturesFooter}</div>
              ) : null}

              {footerAction ? <div className="pt-8">{footerAction}</div> : null}
            </div>
          </div>

          {legal ? <p className="text-muted text-center text-xs leading-relaxed">{legal}</p> : null}
        </div>
      </div>
    </div>
  );
}
