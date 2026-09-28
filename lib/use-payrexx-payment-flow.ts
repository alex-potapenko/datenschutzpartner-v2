'use client';

import { useCallback, useRef, useState } from 'react';

/** POC STUB (Payrexx): minimum spinner time on Pay / Continue with payment. */
export const PAYREXX_STUB_PROCESSING_MS = 2000;

/** @deprecated Use {@link PAYREXX_STUB_PROCESSING_MS}. */
export const PAYREXX_PROCESSING_MS = PAYREXX_STUB_PROCESSING_MS;

/** POC STUB — waits until at least {@link PAYREXX_STUB_PROCESSING_MS} have passed since `startedAt`. */
export function awaitPayrexxStubProcessing(startedAt: number): Promise<void> {
  const remaining = Math.max(0, PAYREXX_STUB_PROCESSING_MS - (Date.now() - startedAt));
  if (remaining <= 0) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}

export type PayrexxPaymentPhase = 'idle' | 'payrexx' | 'confirmed';

/**
 * POC STUB (Payrexx) — replace before production.
 *
 * In-page checkout: `open(task)` shows the Payrexx simulation, `pay()` runs the
 * purchase and moves to `confirmed`. A failed `pay()` rethrows and stays on Payrexx.
 *
 * Production: drop this hook. "Continue with payment" creates a checkout session and
 * redirects the browser to the session's Payrexx `redirectUrl`; the backend completes
 * the order from the Payrexx webhook and Payrexx sends the member back to `returnUrl`,
 * where the confirmation screen reads the result. The artificial
 * `PAYREXX_STUB_PROCESSING_MS` delay goes away with it.
 */
export function usePayrexxPaymentFlow() {
  const [phase, setPhase] = useState<PayrexxPaymentPhase>('idle');
  const [isOpening, setIsOpening] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const taskRef = useRef<(() => Promise<void>) | null>(null);

  const open = useCallback(async (task: () => Promise<void>) => {
    taskRef.current = task;
    setIsOpening(true);
    const started = Date.now();
    try {
      await awaitPayrexxStubProcessing(started);
      setPhase('payrexx');
      window.scrollTo({ top: 0 });
    } finally {
      setIsOpening(false);
    }
  }, []);

  const cancel = useCallback(() => {
    taskRef.current = null;
    setPhase('idle');
  }, []);

  const pay = useCallback(async () => {
    const task = taskRef.current;
    if (!task) return;
    setIsPaying(true);
    const started = Date.now();
    try {
      await task();
      await awaitPayrexxStubProcessing(started);
      taskRef.current = null;
      setPhase('confirmed');
      window.scrollTo({ top: 0 });
    } finally {
      setIsPaying(false);
    }
  }, []);

  return { phase, isOpening, isPaying, open, cancel, pay };
}
