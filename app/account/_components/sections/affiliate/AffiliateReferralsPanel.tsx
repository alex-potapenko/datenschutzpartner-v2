'use client';

import { useTranslations } from 'next-intl';
import type { AffiliateDashboard } from '@/api/affiliate';
import { AffiliateReferralsTable } from '../../AffiliateReferralsTable';
import { AccountSection } from '../../account-ui';

export function AffiliateReferralsPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.dashboard');
  const title = t('referralsTitle');

  return (
    <AccountSection title={title} contentClassName="gap-0">
      {dashboard.referrals.length > 0 ? (
        <AffiliateReferralsTable referrals={dashboard.referrals} ariaLabel={title} />
      ) : (
        <p className="text-muted text-sm leading-relaxed">{t('referralsEmpty')}</p>
      )}
    </AccountSection>
  );
}
