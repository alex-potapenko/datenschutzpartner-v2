'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { calculateAmountInclVat } from '@/api/checkout';
import { Button, Chip, Lock, Spinner } from '@/components/ui';
import type { PayrexxOrderItem } from '@/lib/payrexx-order-lines';
import { formatCheckoutChf } from '@/components/shared/ServiceCheckoutPlanCard';

/*
 * POC STUB (Payrexx) — replace before production.
 *
 * Fake Payrexx hosted payment page: no card entry, no PSP call — "Pay" just runs the
 * mocked purchase. The real Payrexx page is hosted by Payrexx outside this app, so in
 * production this file (and the `--payrexx*` tokens / `public/brands/payrexx.png`, `mastercard.png`) is
 * deleted, not restyled. See docs/data-layer.md → "Payrexx".
 */

/** Neutral product list for the Payrexx stub — not the in-app "Your order" block. */
function PayrexxOrderItemsList({ items }: { items: PayrexxOrderItem[] }) {
  const t = useTranslations('checkout.payrexx');

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground text-sm font-medium">{t('orderItems')}</p>
      <ul className="border-border divide-border divide-y rounded-lg border text-sm">
        {items.map((item) => (
          <li key={`${item.title}-${item.detail}`} className="px-4 py-3">
            <p className="text-foreground leading-snug">{item.title}</p>
            {item.detail ? (
              <p className="text-muted mt-0.5 text-xs leading-relaxed">{item.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Chrome of the simulated Payrexx hosted payment page. */
export function PayrexxPaymentFrame({ children }: { children: ReactNode }) {
  const t = useTranslations('checkout.payrexx');

  return (
    <main className="bg-surface-secondary flex min-h-dvh flex-1 items-center justify-center px-4 py-12">
      <section className="border-border bg-background flex w-full max-w-md flex-col gap-6 rounded-2xl border p-6 shadow-sm sm:p-8">
        <header className="flex items-center justify-between gap-3">
          <Image
            src="/brands/payrexx.png"
            alt={t('brand')}
            width={896}
            height={199}
            className="h-6 w-auto"
            priority
          />
          <Chip variant="soft" size="sm" color="warning">
            {t('simulation')}
          </Chip>
        </header>
        {children}
      </section>
    </main>
  );
}

export function PayrexxPaymentForm({
  items,
  amountExclVat,
  isPaying,
  onPay,
  onCancel,
}: {
  items: PayrexxOrderItem[];
  amountExclVat: number;
  isPaying: boolean;
  onPay: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('checkout.payrexx');
  const amountInclVat = calculateAmountInclVat(amountExclVat);
  const amountLabel = formatCheckoutChf(amountInclVat);

  return (
    <div className="flex flex-col gap-6">
      <PayrexxOrderItemsList items={items} />

      <div className="border-border flex flex-col gap-1 border-y py-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted text-sm">{t('amountLabel')}</p>
          <p className="text-foreground text-2xl font-semibold tabular-nums">{amountLabel}</p>
        </div>
        <p className="text-muted text-right text-xs">{t('vatNote')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-foreground text-sm font-medium">{t('paymentMethod')}</p>
        <div className="border-border bg-surface flex items-center gap-3 rounded-lg border px-4 py-3">
          <Image
            src="/brands/mastercard.png"
            alt=""
            width={28}
            height={24}
            className="h-5 w-auto shrink-0"
          />
          <span className="text-foreground text-sm">{t('testCard')}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          className="h-14 w-full gap-2 rounded-full bg-(--payrexx) font-sans text-base text-white hover:bg-(--payrexx-hover) data-[hovered=true]:bg-(--payrexx-hover)"
          isDisabled={isPaying}
          onPress={onPay}
        >
          {isPaying ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" aria-hidden />
              {t('processing')}
            </span>
          ) : (
            <>
              <Lock size={16} weight="fill" aria-hidden />
              {t('payCta', { amount: amountLabel })}
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="self-center font-sans"
          isDisabled={isPaying}
          onPress={onCancel}
        >
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}

/** Full-page Payrexx simulation shown in place of the hosted payment page. */
export function PayrexxPaymentScreen(props: Parameters<typeof PayrexxPaymentForm>[0]) {
  return (
    <PayrexxPaymentFrame>
      <PayrexxPaymentForm {...props} />
    </PayrexxPaymentFrame>
  );
}
