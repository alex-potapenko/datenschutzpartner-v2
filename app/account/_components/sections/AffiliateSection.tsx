'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAffiliateDashboard, useMyAffiliateApplication } from '@/api/affiliate';
import { AffiliateQuitProgramLink } from '@/components/shared/affiliate/AffiliateQuitProgramLink';
import { AffiliateProgramHero } from '@/components/shared/affiliate/AffiliateProgramHero';
import { AffiliateServiceLanding } from '@/components/shared/AffiliateServiceLanding';
import { AccountSectionFrame, DataState } from '../account-ui';
import { AffiliateProgramAboutPanel } from './AffiliateProgramAboutPanel';
import { AffiliatePartnerDetailsPanel } from './AffiliatePartnerDetailsPanel';
import {
  AFFILIATE_PARTNER_TAB_IDS,
  AnimatedServiceTabContent,
  parseAffiliatePartnerTab,
} from './service-tabs';

export function AffiliateSection() {
  const t = useTranslations('account.affiliate');
  const searchParams = useSearchParams();
  const application = useMyAffiliateApplication();
  const dashboard = useAffiliateDashboard();
  const tab = parseAffiliatePartnerTab(searchParams.get('tab')) ?? 'details';

  const isLoading = application.isLoading || dashboard.isLoading;
  const isPartner = Boolean(dashboard.data);
  const showRegistrationForm =
    !isPartner && application.data?.status !== 'pending' && application.data?.status !== 'approved';
  const showApplicationStatus = !isPartner && application.data?.status === 'pending';

  const showHero =
    !isPartner &&
    tab === 'details' &&
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
        <AnimatedServiceTabContent tabKey={tab} tabOrder={AFFILIATE_PARTNER_TAB_IDS}>
          {tab === 'details' ? (
            <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
              {isPartner ? (
                <AffiliatePartnerDetailsPanel />
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
          ) : null}
          {tab === 'about' ? (
            <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
              {isPartner ? (
                <AffiliateProgramAboutPanel />
              ) : (
                <AffiliateServiceLanding
                  showRegistrationForm={false}
                  showApplicationStatus={false}
                  formVariant="account"
                  embeddedInAccount
                />
              )}
            </div>
          ) : null}
        </AnimatedServiceTabContent>
      </AccountSectionFrame>
    </DataState>
  );
}
