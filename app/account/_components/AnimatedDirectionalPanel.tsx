'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const SLIDE_OFFSET_PX = 24;

/** 1 = forward (down/right in list), -1 = back. */
export function useSlideDirection(activeKey: string, order: readonly string[]): 1 | -1 | 0 {
  const [prevKey, setPrevKey] = useState(activeKey);
  const [direction, setDirection] = useState<1 | -1 | 0>(0);

  if (activeKey !== prevKey) {
    const prevIndex = order.indexOf(prevKey);
    const nextIndex = order.indexOf(activeKey);
    const nextDirection: 1 | -1 | 0 =
      prevIndex === -1 || nextIndex === -1
        ? 0
        : nextIndex > prevIndex
          ? 1
          : nextIndex < prevIndex
            ? -1
            : 0;
    setDirection(nextDirection);
    setPrevKey(activeKey);
  }

  return direction;
}

type SlideAxis = 'x' | 'y';

function slideOffset(axis: SlideAxis, amount: number) {
  return axis === 'x' ? { x: amount } : { y: amount };
}

/**
 * Panel swap driven by list order. Tabs use `x`, sidebar sections use `y`.
 */
export function AnimatedDirectionalPanel({
  activeKey,
  order,
  axis = 'x',
  children,
  className,
}: {
  activeKey: string;
  order: readonly string[];
  /** `x` for tabs (horizontal), `y` for sidebar sections (vertical). */
  axis?: SlideAxis;
  children: ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const direction = useSlideDirection(activeKey, order);
  const offset = shouldReduceMotion ? 0 : SLIDE_OFFSET_PX;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeKey}
        initial={{ opacity: shouldReduceMotion ? 1 : 0, ...slideOffset(axis, offset * direction) }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: shouldReduceMotion ? 1 : 0, ...slideOffset(axis, -offset * direction) }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.1, ease: 'easeOut' }}
        className={cn('w-full min-w-0', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
