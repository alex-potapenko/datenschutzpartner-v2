'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { resolveEuRepPlan, type EuRepPlanId } from '@/api/checkout';
import { Plus } from '@/components/ui';
import { AnimatedRollingNumber } from '@/components/shared/AnimatedRollingNumber';
import { priceBlockAmountClassName, priceBlockNoteClassName } from '@/components/shared/PriceBlock';

const NOTE_TRANSITION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const };
const INLINE_REQUESTS_SHIFT = 12;

const NOTE_VARIANTS = {
  enter: (direction: number) => ({ opacity: 0, y: direction * 6 }),
  center: { opacity: 1, y: 0 },
  exit: (direction: number) => ({ opacity: 0, y: direction * -6 }),
};

const INLINE_REQUESTS_VARIANTS = {
  enter: { opacity: 0, y: INLINE_REQUESTS_SHIFT },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -INLINE_REQUESTS_SHIFT },
};

const INCLUDED_REQUESTS: Record<'plus' | 'plus5', number> = {
  plus: 1,
  plus5: 5,
};

function crossesBasisBoundary(previousPlanId: EuRepPlanId, planId: EuRepPlanId) {
  return (previousPlanId === 'basis') !== (planId === 'basis');
}

function AnimatedFullNote({
  panelKey,
  direction,
  children,
}: {
  panelKey: string;
  direction: number;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.span
        key={panelKey}
        custom={direction}
        variants={NOTE_VARIANTS}
        initial="enter"
        animate="center"
        exit="exit"
        transition={NOTE_TRANSITION}
        className="inline-block leading-snug"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

function IncludedRequestsNote({ planId }: { planId: 'plus' | 'plus5' }) {
  const t = useTranslations('euRepPage.plans');

  return (
    <>
      <AnimatedRollingNumber
        value={INCLUDED_REQUESTS[planId]}
        className="inline-flex align-baseline text-sm leading-snug font-normal tabular-nums"
      />
      {t(`${planId}.requestsRest`)}
    </>
  );
}

function InlineIncludedRequests({ planId }: { planId: EuRepPlanId }) {
  const t = useTranslations('euRepPage.plans');
  const count = resolveEuRepPlan(planId).includedRequests;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1">
        <Plus size={20} weight="bold" className="text-foreground shrink-0" aria-hidden />
        <AnimatedRollingNumber value={count} className={priceBlockAmountClassName()} />
      </span>
      <span className={priceBlockNoteClassName('default', 'foreground')}>
        {t(count === 1 ? 'requestSingular' : 'requestPlural')}
      </span>
    </span>
  );
}

function AnimatedInlineIncludedRequests({ planId }: { planId: EuRepPlanId }) {
  const reduceMotion = useReducedMotion();
  const show = planId !== 'basis';

  if (reduceMotion) {
    return show ? <InlineIncludedRequests planId={planId} /> : null;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {show ? (
        <motion.span
          key="included"
          variants={INLINE_REQUESTS_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={NOTE_TRANSITION}
          className="inline-flex"
        >
          <InlineIncludedRequests planId={planId} />
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

export function EuRepPlanRequestsSubline({
  planId,
  previousPlanId,
  direction,
}: {
  planId: EuRepPlanId;
  previousPlanId: EuRepPlanId;
  direction: number;
}) {
  const t = useTranslations('euRepPage.plans');
  const suffixKey = planId === 'basis' ? 'requestPriceSuffixBasis' : 'requestPriceSuffixAdditional';
  const suffix = t(suffixKey);
  const suffixPanelKey = planId === 'basis' ? 'basis' : 'additional';
  const className = 'text-foreground text-sm leading-snug';
  const animateSuffix = crossesBasisBoundary(previousPlanId, planId);

  return (
    <p className={className}>
      {t('requestPriceAmount')}{' '}
      {animateSuffix ? (
        <AnimatedFullNote panelKey={suffixPanelKey} direction={direction}>
          {suffix}
        </AnimatedFullNote>
      ) : (
        <span>{suffix}</span>
      )}
    </p>
  );
}

export function EuRepPlanRequestsNote({
  planId,
  previousPlanId,
  direction,
  variant = 'block',
}: {
  planId: EuRepPlanId;
  previousPlanId: EuRepPlanId;
  direction: number;
  variant?: 'block' | 'inline';
}) {
  const t = useTranslations('euRepPage.plans');
  const className = 'text-foreground text-sm leading-snug';

  if (variant === 'inline') {
    return <AnimatedInlineIncludedRequests planId={planId} />;
  }

  if (planId === 'basis') {
    const content = t('basis.requests');
    if (crossesBasisBoundary(previousPlanId, planId)) {
      return (
        <p className={className}>
          <AnimatedFullNote panelKey="basis" direction={direction}>
            {content}
          </AnimatedFullNote>
        </p>
      );
    }
    return <p className={className}>{content}</p>;
  }

  const content = <IncludedRequestsNote planId={planId} />;

  if (crossesBasisBoundary(previousPlanId, planId)) {
    return (
      <p className={className}>
        <AnimatedFullNote panelKey={planId} direction={direction}>
          {content}
        </AnimatedFullNote>
      </p>
    );
  }

  return <p className={className}>{content}</p>;
}
