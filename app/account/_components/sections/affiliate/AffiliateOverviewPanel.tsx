'use client';

import { useTranslations } from 'next-intl';
import { useSession } from '@/api/auth';
import type { AffiliateDashboard } from '@/api/affiliate';
import { NavigationLink } from '@/components/shared/NavigationLink';
import {
  Alert,
  ArrowsLeftRight,
  ChartBar,
  CheckCircle,
  Clock,
  CurrencyDollar,
  CursorClick,
} from '@/components/ui';
import { AFFILIATE_ACCOUNT_HREF, AFFILIATE_ADMIN_HREF } from '@/lib/account-routes';
import { AffiliatePartnerStatsRow } from '../../AffiliatePartnerStatsRow';
import { AffiliateReferralsTable } from '../../AffiliateReferralsTable';
import { AccountSection } from '../../account-ui';
import { AffiliatePayoutInfo } from './AffiliatePayoutInfo';

const LATEST_REFERRALS = 5;

export function AffiliateOverviewPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.overview');
  const tAffiliate = useTranslations('account.affiliate');
  const session = useSession();
  const { stats, referrals, partner } = dashboard;
  const converted =
    stats.referralCounts.pending + stats.referralCounts.unpaid + stats.referralCounts.paid;
  const latest = referrals.slice(0, LATEST_REFERRALS);

  return (
    <div className="divide-border flex min-w-0 flex-1 flex-col divide-y">
      {partner.status === 'inactive' ? (
        <div className="px-4 pt-6 sm:px-8">
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('inactiveTitle')}</Alert.Title>
              <Alert.Description className="text-foreground text-sm">
                {t('inactiveBody')}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      ) : null}
      <AccountSection title={t('earningsTitle')} contentClassName="gap-6">
        <AffiliatePartnerStatsRow
          items={[
            {
              key: 'unpaid',
              icon: <CurrencyDollar size={18} weight="fill" />,
              label: t('unpaid'),
              value: stats.unpaidEarningsChf,
              format: 'chf',
              note: t('unpaidNote'),
            },
            {
              key: 'pending',
              icon: <Clock size={18} weight="fill" />,
              label: t('pending'),
              value: stats.pendingEarningsChf,
              format: 'chf',
              note: t('pendingNote'),
            },
            {
              key: 'paid',
              icon: <CheckCircle size={18} weight="fill" />,
              label: t('paid'),
              value: stats.paidEarningsChf,
              format: 'chf',
              note: t('paidNote'),
            },
          ]}
        />
        <AffiliatePayoutInfo dashboard={dashboard} />
      </AccountSection>

      <AccountSection title={t('activityTitle')} contentClassName="gap-6">
        <AffiliatePartnerStatsRow
          items={[
            {
              key: 'visits',
              icon: <CursorClick size={18} weight="fill" />,
              label: t('visits'),
              value: stats.visits,
              format: 'count',
            },
            {
              key: 'referrals',
              icon: <ArrowsLeftRight size={18} weight="bold" />,
              label: t('referrals'),
              value: converted,
              format: 'count',
              note: t('commissionNote', { rate: Math.round(partner.commissionRate * 1000) / 10 }),
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

      <AccountSection
        title={t('latestTitle')}
        contentClassName="gap-4"
        action={
          referrals.length > LATEST_REFERRALS ? (
            <NavigationLink
              href={`${AFFILIATE_ACCOUNT_HREF}&tab=referrals`}
              chevron="right"
              size="sm"
            >
              {t('allReferrals')}
            </NavigationLink>
          ) : undefined
        }
      >
        {latest.length > 0 ? (
          <AffiliateReferralsTable referrals={latest} ariaLabel={t('latestTitle')} />
        ) : (
          <p className="text-muted text-sm leading-relaxed">
            {tAffiliate('dashboard.referralsEmpty')}
          </p>
        )}
        {session.data?.role === 'admin' ? (
          <NavigationLink href={AFFILIATE_ADMIN_HREF} chevron="right" size="sm">
            {tAffiliate('adminLink')}
          </NavigationLink>
        ) : null}
      </AccountSection>
    </div>
  );
}
