'use client';

import { useTranslations } from 'next-intl';
import { useSession } from '@/api/auth';
import { useAffiliateDashboard, useCreateAffiliateReferralLink } from '@/api/affiliate';
import { AffiliateConversionsTable } from '../AffiliateConversionsTable';
import { AffiliatePartnerStatsRow } from '../AffiliatePartnerStatsRow';
import { AffiliateReferralLinkRow } from '../AffiliateReferralLinkRow';
import { AccountSection } from '../account-ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { AFFILIATE_ADMIN_HREF } from '@/lib/account-routes';
import { Button, Plus } from '@/components/ui';

export function AffiliatePartnerDetailsPanel() {
  const t = useTranslations('account.affiliate');
  const session = useSession();
  const dashboard = useAffiliateDashboard();
  const createLink = useCreateAffiliateReferralLink();

  const isAdmin = session.data?.role === 'admin';

  if (!dashboard.data) {
    return null;
  }

  const { recentConversions, referralLinks } = dashboard.data;
  const conversionsTitle = t('dashboard.conversionsTitle');
  return (
    <div className="divide-border flex min-w-0 flex-1 flex-col divide-y">
      <AccountSection title={t('dashboard.linkTitle')} contentClassName="gap-6">
        <AffiliatePartnerStatsRow
          clicks={dashboard.data.clicks}
          conversions={dashboard.data.conversions}
          balanceChf={dashboard.data.commissionBalanceChf}
        />

        <div className="flex min-w-0 flex-col gap-4">
          {referralLinks.length > 0 ? (
            <div className="border-border divide-border flex flex-col divide-y overflow-hidden rounded-xl border">
              {referralLinks.map((link) => (
                <AffiliateReferralLinkRow key={link.id} link={link} />
              ))}
            </div>
          ) : null}
          <div>
            <Button
              variant="outline"
              size="sm"
              isDisabled={createLink.isPending}
              onPress={() => {
                void createLink.mutateAsync();
              }}
            >
              <Plus size={16} weight="bold" aria-hidden />
              {t('dashboard.linksAdd')}
            </Button>
          </div>
        </div>

        {isAdmin ? (
          <NavigationLink href={AFFILIATE_ADMIN_HREF} chevron="right" size="sm">
            {t('adminLink')}
          </NavigationLink>
        ) : null}
      </AccountSection>

      <AccountSection title={conversionsTitle} contentClassName="gap-0">
        {recentConversions.length > 0 ? (
          <AffiliateConversionsTable conversions={recentConversions} ariaLabel={conversionsTitle} />
        ) : (
          <p className="text-muted text-sm leading-relaxed">{t('dashboard.conversionsEmpty')}</p>
        )}
      </AccountSection>
    </div>
  );
}
