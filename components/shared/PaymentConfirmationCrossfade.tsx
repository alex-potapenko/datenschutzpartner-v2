'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ConfirmingPaymentPhase } from '@/lib/use-confirming-payment-flow';
import type { PayrexxPaymentPhase } from '@/lib/use-payrexx-payment-flow';

export function PaymentConfirmationCrossfade({
  phase,
  confirming,
  confirmed,
}: {
  phase: ConfirmingPaymentPhase | PayrexxPaymentPhase;
  /** Shown while `phase` is `confirming` or `payrexx`. */
  confirming: ReactNode;
  confirmed: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.35;

  return (
    <AnimatePresence mode="wait">
      {phase === 'confirming' || phase === 'payrexx' ? (
        <motion.div
          key="confirming"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: 'easeInOut' }}
        >
          {confirming}
        </motion.div>
      ) : null}
      {phase === 'confirmed' ? (
        <motion.div
          key="confirmed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration, ease: 'easeInOut' }}
        >
          {confirmed}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
