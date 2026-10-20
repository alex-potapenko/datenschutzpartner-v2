'use client';

import { useTranslations } from 'next-intl';
import type { AffiliatePartnerStatus } from '@/api/affiliate';
import { StatusPill, type StatusTone } from '@/components/shared/StatusPill';

const PARTNER_STATUS_TONE: Record<AffiliatePartnerStatus, StatusTone> = {
  active: 'success',
  inactive: 'neutral',
};

export function AffiliatePartnerStatusPill({ status }: { status: AffiliatePartnerStatus }) {
  const t = useTranslations('account.affiliate.partnerStatus');
  return <StatusPill tone={PARTNER_STATUS_TONE[status]}>{t(status)}</StatusPill>;
}
