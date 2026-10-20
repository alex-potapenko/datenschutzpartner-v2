'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useAffiliateDashboard,
  useMyAffiliateApplication,
  type AffiliateDashboard,
} from '@/api/affiliate';
import { AffiliateProgramHero } from '@/components/shared/affiliate/AffiliateProgramHero';
import { AffiliateServiceLanding } from '@/components/shared/AffiliateServiceLanding';
import { cn } from '@/components/ui';
import { AccountSectionFrame, DataState } from '../account-ui';
import { AffiliateLinksPanel } from './affiliate/AffiliateLinksPanel';
import { AffiliateOverviewPanel } from './affiliate/AffiliateOverviewPanel';
import { AffiliatePayoutHowItWorksAction } from './affiliate/AffiliatePayoutInfo';
import { AffiliatePayoutsPanel } from './affiliate/AffiliatePayoutsPanel';
import { AffiliateReferralsPanel } from './affiliate/AffiliateReferralsPanel';
import { AffiliateSettingsPanel } from './affiliate/AffiliateSettingsPanel';
import { AffiliateVisitsPanel } from './affiliate/AffiliateVisitsPanel';
import { AffiliateVouchersPanel } from './affiliate/AffiliateVouchersPanel';
import { useAffiliateSidebarNav } from '../useAffiliateSidebarNav';
import {
  AnimatedServiceTabContent,
  affiliateTabIds,
  parseAffiliateTab,
  type ServiceTabId,
} from './service-tabs';

function partnerPanel(tab: ServiceTabId, dashboard: AffiliateDashboard): ReactNode {
  switch (tab) {
    case 'links':
      return <AffiliateLinksPanel dashboard={dashboard} />;
    case 'referrals':
      return <AffiliateReferralsPanel dashboard={dashboard} />;
    case 'visits':
      return <AffiliateVisitsPanel />;
    case 'payouts':
      return <AffiliatePayoutsPanel dashboard={dashboard} />;
    case 'vouchers':
      return <AffiliateVouchersPanel dashboard={dashboard} />;
    case 'settings':
      return <AffiliateSettingsPanel partner={dashboard.partner} />;
    default:
      return <AffiliateOverviewPanel dashboard={dashboard} />;
  }
}

export function AffiliateSection() {
  const t = useTranslations('account.affiliate');
  const tTabs = useTranslations('account.serviceTabs');
  const searchParams = useSearchParams();
  const application = useMyAffiliateApplication();
  const dashboard = useAffiliateDashboard();
  const sidebarNav = useAffiliateSidebarNav();

  const isLoading = application.isLoading || dashboard.isLoading;
  const hideSectionChrome = sidebarNav.isLoading || !sidebarNav.visible;
  const isPartner = Boolean(dashboard.data);
  const tab = parseAffiliateTab(searchParams.get('tab'), isPartner);
  const applicationPending = !isPartner && application.data?.status === 'pending';
  const showRegistrationForm = !isPartner && application.data?.status !== 'approved';

  const showHero = !isPartner && tab === 'overview' && application.data?.status !== 'approved';
  return (
    <DataState
      isLoading={isLoading}
      isError={application.isError || dashboard.isError}
      onRetry={() => {
        void application.refetch();
        void dashboard.refetch();
      }}
    >
      <AccountSectionFrame
        title={sidebarNav.visible ? tTabs(tab) : t('title')}
        hideTitle={hideSectionChrome}
        contentOverflowVisible={!isPartner}
        action={
          tab === 'payouts' && dashboard.data ? (
            <AffiliatePayoutHowItWorksAction dashboard={dashboard.data} />
          ) : undefined
        }
      >
        <AnimatedServiceTabContent
          tabKey={tab}
          tabOrder={affiliateTabIds(isPartner)}
          className={isPartner ? undefined : 'overflow-visible'}
        >
          <div
            className={cn(
              '-mx-4 min-w-0 sm:-mx-8',
              isPartner ? 'overflow-x-clip' : 'overflow-visible'
            )}
          >
            {dashboard.data ? (
              partnerPanel(tab, dashboard.data)
            ) : (
              <div className="bg-background min-w-0 overflow-visible">
                {showHero ? <AffiliateProgramHero /> : null}
                <AffiliateServiceLanding
                  showRegistrationForm={showRegistrationForm}
                  applicationPending={applicationPending}
                  formVariant="account"
                  embeddedInAccount
                />
              </div>
            )}
          </div>
        </AnimatedServiceTabContent>
      </AccountSectionFrame>
    </DataState>
  );
}
