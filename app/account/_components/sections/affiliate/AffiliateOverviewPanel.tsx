'use client';

import { useTranslations } from 'next-intl';
import type { AffiliateDashboard } from '@/api/affiliate';
import {
  ArrowsLeftRight,
  ChartBar,
  CheckCircle,
  Clock,
  CurrencyDollar,
  CursorClick,
} from '@/components/ui';
import { InfoTooltip } from '@/components/shared/InfoTooltip';
import { AffiliatePartnerStatsRow } from '../../AffiliatePartnerStatsRow';
import { AffiliatePartnerInactiveBanner } from './AffiliatePartnerInactiveBanner';
import { AccountSection, useDateFormatter } from '../../account-ui';
import { AffiliatePayoutHowItWorksAction } from './AffiliatePayoutInfo';
import { AffiliatePrototypeControls } from './AffiliatePrototypeControls';

export function AffiliateOverviewPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.overview');
  const formatDate = useDateFormatter();
  const { stats, partner } = dashboard;

  return (
    <div className="divide-border flex min-w-0 flex-1 flex-col divide-y">
      {partner.status === 'inactive' ? <AffiliatePartnerInactiveBanner /> : null}
      <AccountSection
        title={t('earningsTitle')}
        contentClassName="gap-6"
        action={<AffiliatePayoutHowItWorksAction dashboard={dashboard} />}
      >
        <AffiliatePartnerStatsRow
          items={[
            {
              key: 'pending',
              icon: <Clock size={18} weight="fill" />,
              label: t('pendingEarnings'),
              value: stats.pendingEarningsChf,
              format: 'chf',
              labelAside: (
                <InfoTooltip label={t('pendingEarningsHelpLabel')}>
                  {t('pendingEarningsNote')}
                </InfoTooltip>
              ),
            },
            {
              key: 'unpaid',
              icon: <CurrencyDollar size={18} weight="fill" />,
              label: t('unpaidEarnings'),
              value: stats.unpaidEarningsChf,
              format: 'chf',
              labelAside: (
                <InfoTooltip label={t('unpaidEarningsHelpLabel')}>
                  {t('unpaidEarningsNote')}
                </InfoTooltip>
              ),
              subtitle: t('nextPayoutDate', { date: formatDate(dashboard.nextPayoutDate) }),
            },
            {
              key: 'paid',
              icon: <CheckCircle size={18} weight="fill" />,
              label: t('paidOutToDate'),
              value: stats.paidOutToDateChf,
              format: 'chf',
            },
          ]}
        />
      </AccountSection>

      <AccountSection title={t('activityTitle')} contentClassName="gap-6">
        <AffiliatePartnerStatsRow
          items={[
            {
              key: 'referral-status-counts',
              icon: <ArrowsLeftRight size={18} weight="bold" />,
              label: t('settlementTitle'),
              format: 'referralStatusCounts',
              labelAside: (
                <InfoTooltip label={t('settlementCountsHelpLabel')}>
                  {t('settlementCountsNote')}
                </InfoTooltip>
              ),
              statusCounts: {
                pending: stats.referralCounts.pending,
                unpaid: stats.referralCounts.unpaid,
                paid: stats.referralCounts.paid,
              },
              statusLabels: {
                pending: t('pendingEarnings'),
                unpaid: t('unpaidReferrals'),
                paid: t('paidReferrals'),
              },
            },
            {
              key: 'visits',
              icon: <CursorClick size={18} weight="fill" />,
              label: t('visits'),
              value: stats.visits,
              format: 'count',
            },
            {
              key: 'rate',
              icon: <ChartBar size={18} weight="fill" />,
              label: t('conversionRate'),
              value: stats.conversionRate,
              format: 'percent',
            },
          ]}
        />
      </AccountSection>

      <AffiliatePrototypeControls dashboard={dashboard} />
    </div>
  );
}
