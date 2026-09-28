'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  SUBSCRIPTION_RENEWED_PARAM,
  useCheckoutSession,
  useCompleteCheckoutSession,
} from '@/api/checkout';
import { Button, Spinner } from '@/components/ui';
import { PayrexxPaymentForm, PayrexxPaymentFrame } from '@/components/shared/PayrexxPaymentScreen';
import { safeAccountReturnTo } from '@/lib/account-routes';
import { payrexxOrderLinesFromSession } from '@/lib/payrexx-order-lines';
import { usePayrexxOrderLineLabels } from '@/lib/use-payrexx-order-line-labels';
import { awaitPayrexxStubProcessing } from '@/lib/use-payrexx-payment-flow';

const FALLBACK_RETURN_URL = '/account';

function withQueryParam(href: string, key: string, value: string): string {
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${path}?${params.toString()}`;
}

/**
 * POC STUB (Payrexx) — replace before production.
 *
 * Stand-in for the Payrexx hosted payment page. In production the member is
 * redirected to Payrexx, which sends them back to the session's `returnUrl`;
 * the order is completed server-side from the Payrexx webhook, not by calling
 * `POST /checkout/sessions/:id/complete` from the browser. Delete the whole
 * `/checkout/payrexx` route.
 */
export function PayrexxSimulationApp() {
  const t = useTranslations('checkout.payrexx');
  const orderLabels = usePayrexxOrderLineLabels();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const session = useCheckoutSession(sessionId);
  const complete = useCompleteCheckoutSession();
  const [isPaying, setIsPaying] = useState(false);

  const returnUrl = safeAccountReturnTo(session.data?.returnUrl) ?? FALLBACK_RETURN_URL;
  const payrexxOrderLines = useMemo(
    () => (session.data ? payrexxOrderLinesFromSession(session.data, orderLabels) : []),
    [orderLabels, session.data]
  );

  async function handlePay() {
    if (!session.data) return;
    setIsPaying(true);
    const started = Date.now();
    try {
      const result = await complete.mutateAsync(session.data.id);
      await awaitPayrexxStubProcessing(started);
      const renewedId = result.subscriptionId ?? session.data.subscriptionId;
      router.replace(
        session.data.kind === 'subscriptionRenewal' && renewedId
          ? withQueryParam(returnUrl, SUBSCRIPTION_RENEWED_PARAM, renewedId)
          : returnUrl
      );
    } catch {
      toast.error(t('failed'));
      setIsPaying(false);
    }
  }

  let content;
  if (session.isLoading) {
    content = (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner aria-label={t('loading')} />
      </div>
    );
  } else if (!session.data || session.data.status === 'completed') {
    content = (
      <div className="flex flex-col items-start gap-5">
        <p className="text-foreground text-sm leading-relaxed">
          {session.data ? t('alreadyPaid') : t('notFound')}
        </p>
        <Button
          variant="outline"
          className="font-sans"
          onPress={() => {
            router.replace(returnUrl);
          }}
        >
          {t('backToAccount')}
        </Button>
      </div>
    );
  } else {
    content = (
      <PayrexxPaymentForm
        items={payrexxOrderLines}
        amountExclVat={session.data.amount}
        isPaying={isPaying}
        onPay={() => void handlePay()}
        onCancel={() => {
          router.replace(returnUrl);
        }}
      />
    );
  }

  return <PayrexxPaymentFrame>{content}</PayrexxPaymentFrame>;
}
