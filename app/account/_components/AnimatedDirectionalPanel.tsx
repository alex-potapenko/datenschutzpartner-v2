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
      className="w-full min-w-0 overflow-visible"
      initial={false}
      animate={{ height }}
      transition={HEIGHT_TRANSITION}
      onAnimationComplete={() => {
        setHeight('auto');
      }}
      style={{
        position: 'relative',
        // Keep visible during height tween so HeroGlow / BrandGlow are not clipped at the column edge.
        overflow: 'visible',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={activeKey}
          custom={direction}
          variants={{
            enter: (dir: number) => ({ opacity: 0, ...slideOffset(axis, offset * dir) }),
            center: { opacity: 1, x: 0, y: 0 },
            // `custom` is read at exit time, so the leaving panel uses the new direction.
            exit: (dir: number) => ({ opacity: 0, ...slideOffset(axis, -offset * dir) }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_TRANSITION}
          className="w-full min-w-0 overflow-visible"
          style={{ overflow: 'visible' }}
        >
          <div ref={measureRef} className={cn('w-full min-w-0 overflow-visible', className)}>
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
