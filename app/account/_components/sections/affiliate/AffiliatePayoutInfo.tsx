'use client';

import { useTranslations } from 'next-intl';
import { useAffiliateProgramSettings, type AffiliateDashboard } from '@/api/affiliate';
import { Alert } from '@/components/ui';

/** Payouts are an invoice request, not a transfer — partners must know to reply with an invoice. */
export function AffiliatePayoutInfo({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.payoutInfo');
  const settings = useAffiliateProgramSettings();
  const months = settings.data?.payoutCadenceMonths ?? 3;

  return (
    <Alert status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t('title')}</Alert.Title>
        <Alert.Description className="text-foreground text-sm leading-relaxed">
          {t('body', { months })}{' '}
          {t('threshold', { threshold: dashboard.payoutThresholdChf.toFixed(0) })}{' '}
          {t('email', { email: dashboard.partner.notificationEmail })}
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
