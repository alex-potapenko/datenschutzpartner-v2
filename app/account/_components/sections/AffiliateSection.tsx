'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useAffiliateDashboard,
  useMyAffiliateApplication,
  type AffiliateDashboard,
} from '@/api/affiliate';
import { AffiliateQuitProgramLink } from '@/components/shared/affiliate/AffiliateQuitProgramLink';
import { AffiliateProgramHero } from '@/components/shared/affiliate/AffiliateProgramHero';
import { AffiliateServiceLanding } from '@/components/shared/AffiliateServiceLanding';
import { AccountSectionFrame, DataState } from '../account-ui';
import { AffiliateProgramAboutPanel } from './AffiliateProgramAboutPanel';
import { AffiliateLinksPanel } from './affiliate/AffiliateLinksPanel';
import { AffiliateOverviewPanel } from './affiliate/AffiliateOverviewPanel';
import { AffiliatePayoutsPanel } from './affiliate/AffiliatePayoutsPanel';
import { AffiliateReferralsPanel } from './affiliate/AffiliateReferralsPanel';
import { AffiliateSettingsPanel } from './affiliate/AffiliateSettingsPanel';
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
    case 'payouts':
      return <AffiliatePayoutsPanel dashboard={dashboard} />;
    case 'settings':
      return <AffiliateSettingsPanel partner={dashboard.partner} />;
    case 'about':
      return <AffiliateProgramAboutPanel />;
    default:
      return <AffiliateOverviewPanel dashboard={dashboard} />;
  }
}

export function AffiliateSection() {
  const t = useTranslations('account.affiliate');
  const searchParams = useSearchParams();
  const application = useMyAffiliateApplication();
  const dashboard = useAffiliateDashboard();

  const isLoading = application.isLoading || dashboard.isLoading;
  const isPartner = Boolean(dashboard.data);
  const tab = parseAffiliateTab(searchParams.get('tab'), isPartner);
  const showRegistrationForm =
    !isPartner && application.data?.status !== 'pending' && application.data?.status !== 'approved';
  const showApplicationStatus = !isPartner && application.data?.status === 'pending';

  const showHero =
    !isPartner &&
    tab === 'overview' &&
    (!application.data || application.data.status === 'rejected');

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
        title={t('title')}
        action={isPartner ? <AffiliateQuitProgramLink className="inline-flex" /> : undefined}
        contentOverflowVisible={!isPartner}
      >
        <AnimatedServiceTabContent tabKey={tab} tabOrder={affiliateTabIds(isPartner)}>
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            {dashboard.data ? (
              partnerPanel(tab, dashboard.data)
            ) : tab === 'about' ? (
              <AffiliateServiceLanding
                showRegistrationForm={false}
                showApplicationStatus={false}
                formVariant="account"
                embeddedInAccount
              />
            ) : (
              <div className="bg-background min-w-0 overflow-visible">
                {showHero ? <AffiliateProgramHero /> : null}
                <AffiliateServiceLanding
                  showRegistrationForm={showRegistrationForm}
                  showApplicationStatus={showApplicationStatus}
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
