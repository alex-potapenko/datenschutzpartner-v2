'use client';

import { useCallback, useState } from 'react';

export const CONFIRMING_PAYMENT_MS = 5000;

export type ConfirmingPaymentPhase = 'idle' | 'confirming' | 'confirmed';

export function useConfirmingPaymentFlow() {
  const [phase, setPhase] = useState<ConfirmingPaymentPhase>('idle');

  const run = useCallback(async (task: () => Promise<void>) => {
    setPhase('confirming');
    const started = Date.now();

    try {
      await task();
      const remaining = Math.max(0, CONFIRMING_PAYMENT_MS - (Date.now() - started));
      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, remaining);
        });
      }
      setPhase('confirmed');
    } catch (error) {
      setPhase('idle');
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
  }, []);

  return { phase, run, reset };
}
