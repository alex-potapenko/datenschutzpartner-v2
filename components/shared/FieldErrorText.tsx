'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const FIELD_ERROR_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

type FieldErrorTextProps = {
  /** Validation message; the line animates in when it becomes truthy and out when cleared. */
  message?: string | null;
  id?: string;
  className?: string;
};

/** Inline validation message under a form control. */
export function FieldErrorText({ message, id, className }: FieldErrorTextProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          key="field-error"
          id={id}
          className={cn('text-danger overflow-hidden text-xs', className)}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
          transition={reduceMotion ? { duration: 0 } : FIELD_ERROR_TRANSITION}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
