'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const SLIDE_OFFSET_PX = 24;
const SLIDE_TRANSITION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const };
const HEIGHT_TRANSITION = { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const };

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
 * Height interpolates while content cross-fades (popLayout).
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
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [isSettled, setIsSettled] = useState(true);

  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      setHeight(node.offsetHeight);
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (shouldReduceMotion) {
    return <div className={cn('w-full min-w-0', className)}>{children}</div>;
  }

  return (
    <motion.div
      className="w-full min-w-0"
      initial={false}
      animate={{ height }}
      transition={HEIGHT_TRANSITION}
      onAnimationStart={() => {
        setIsSettled(false);
      }}
      onAnimationComplete={() => {
        setIsSettled(true);
        setHeight('auto');
      }}
      style={{
        position: 'relative',
        overflow: isSettled ? 'visible' : 'hidden',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={activeKey}
          initial={{ opacity: 0, ...slideOffset(axis, offset * direction) }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...slideOffset(axis, -offset * direction) }}
          transition={SLIDE_TRANSITION}
          className="w-full min-w-0"
        >
          <div ref={measureRef} className={cn('w-full min-w-0', className)}>
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
