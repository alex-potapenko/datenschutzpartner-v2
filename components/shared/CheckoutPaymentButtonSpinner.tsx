'use client';

import { Spinner } from '@/components/ui';

/** Spinner for primary checkout buttons while the Payrexx POC delay runs. */
export function CheckoutPaymentButtonSpinner({ label }: { label: string }) {
  return (
    <Spinner size="md" color="current" className="text-(--accent-foreground)" aria-label={label} />
  );
}
