'use client';

import { useTranslations } from 'next-intl';
import { ConfirmingStatusScreen } from '@/components/shared/ConfirmingStatusScreen';

export function ConfirmingPaymentScreen() {
  const t = useTranslations('checkout.paymentConfirmation');

  return <ConfirmingStatusScreen title={t('confirmingTitle')} />;
}
