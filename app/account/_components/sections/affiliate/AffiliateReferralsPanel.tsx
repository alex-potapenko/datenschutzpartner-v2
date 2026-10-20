'use client';

import { useTranslations } from 'next-intl';
import type { AffiliateDashboard } from '@/api/affiliate';
import { AccountSection } from '../../account-ui';
import { AffiliateReferralsList } from './AffiliateReferralsList';

export function AffiliateReferralsPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.dashboard');
  const title = t('referralsTitle');

  return (
    <AccountSection contentClassName="gap-4">
      <AffiliateReferralsList dashboard={dashboard} ariaLabel={title} />
    </AccountSection>
  );
}
