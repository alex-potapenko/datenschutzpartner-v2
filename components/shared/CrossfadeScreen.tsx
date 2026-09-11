'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const CROSSFADE_TRANSITION = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

export function CrossfadeScreen({
  screenKey,
  children,
  className,
  panelClassName,
}: {
  screenKey: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('bg-background relative min-h-dvh', className)}>
      <AnimatePresence initial={false}>
        <motion.div
          key={screenKey}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : CROSSFADE_TRANSITION}
          className={cn('bg-background absolute inset-0 min-h-dvh', panelClassName)}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
