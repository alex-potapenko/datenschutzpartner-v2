'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useAnimation, useReducedMotion } from 'motion/react';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { cn } from '@/lib/utils';

type ValidationRequiredBadgeProps = {
  show: boolean;
  /** Increment on each validation attempt to replay the shake. */
  shakeKey?: number;
  children: ReactNode;
  className?: string;
};

/** Required chip — appears with a shake on validation, exits downward on answer. */
export function ValidationRequiredBadge({
  show,
  shakeKey = 0,
  children,
  className,
}: ValidationRequiredBadgeProps) {
  const reduceMotion = useReducedMotion();
  const controls = useAnimation();

  useEffect(() => {
    if (!show) return;

    if (reduceMotion) {
      controls.set({ opacity: 1, y: 0, x: 0 });
      return;
    }

    void controls.start({
      opacity: 1,
      y: 0,
      x: [0, -5, 5, -4, 4, -2, 2, 0],
      transition: {
        opacity: { duration: 0.2 },
        y: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] },
        x: { duration: 0.5, ease: 'easeInOut' },
      },
    });
  }, [show, shakeKey, controls, reduceMotion]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.span
          key="validation-required-badge"
          className={cn('inline-block align-middle', className)}
          initial={reduceMotion ? false : { opacity: 0, y: 0, x: 0 }}
          animate={controls}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          transition={{
            opacity: { duration: 0.2 },
            y: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] },
          }}
        >
          <MetaBadge kind="required">{children}</MetaBadge>
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
