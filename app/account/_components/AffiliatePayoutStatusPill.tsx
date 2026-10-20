'use client';

import { useTranslations } from 'next-intl';
import type { AffiliatePayoutStatus } from '@/api/affiliate';
import { StatusPill, type StatusTone } from '@/components/shared/StatusPill';

const PAYOUT_STATUS_TONE: Record<AffiliatePayoutStatus, StatusTone> = {
  invoice_requested: 'warning',
  transferred: 'success',
};

export function AffiliatePayoutStatusPill({ status }: { status: AffiliatePayoutStatus }) {
  const t = useTranslations('account.affiliate.payouts.status');
  return <StatusPill tone={PAYOUT_STATUS_TONE[status]}>{t(status)}</StatusPill>;
}
