'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { cn } from '@/lib/utils';

type ValidationRequiredBadgeProps = {
  show: boolean;
  /** Hide the chip when the field already shows an inline error (e.g. "Required"). */
  fieldError?: string;
  /** Increment on each validation attempt to replay the shake. */
  shakeKey?: number;
  children: ReactNode;
  className?: string;
};

/** Required chip — visible immediately on validation, shakes on each attempt. */
export function ValidationRequiredBadge({
  show,
  fieldError,
  shakeKey = 0,
  children,
  className,
}: ValidationRequiredBadgeProps) {
  const reduceMotion = useReducedMotion();
  const visible = show && !fieldError;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.span
          key="required"
          className={cn('inline-flex align-middle', className)}
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ opacity: { duration: 0.2 } }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        >
          <motion.span
            key={shakeKey}
            className="inline-flex"
            initial={{ x: 0 }}
            animate={reduceMotion ? { x: 0 } : { x: [0, -5, 5, -4, 4, -2, 2, 0] }}
            transition={{ x: { duration: 0.5, ease: 'easeInOut' } }}
          >
            <MetaBadge kind="required">{children}</MetaBadge>
          </motion.span>
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
