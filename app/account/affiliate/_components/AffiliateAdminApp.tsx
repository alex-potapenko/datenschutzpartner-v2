'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, useRequireSession } from '@/api/auth';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { Spinner, Tabs, useOverlayState } from '@/components/ui';
import { AFFILIATE_ACCOUNT_HREF, AFFILIATE_ADMIN_HREF } from '@/lib/account-routes';
import {
  SECONDARY_TABS_INDICATOR_CLASS,
  SECONDARY_TABS_LIST_CLASS,
  SECONDARY_TABS_TAB_CLASS,
} from '@/app/account/_components/account-ui';
import { AnimatedServiceTabContent } from '@/app/account/_components/sections/service-tabs';
import { AffiliateAdminApplicationsPanel } from './AffiliateAdminApplicationsPanel';
import { AffiliateAdminPartnersPanel } from './AffiliateAdminPartnersPanel';
import { AffiliateAdminPayoutsPanel } from './AffiliateAdminPayoutsPanel';
import { AffiliateAdminReferralsPanel } from './AffiliateAdminReferralsPanel';
import { AffiliateCreatePayoutDialog } from './AffiliateCreatePayoutDialog';
import {
  AFFILIATE_ADMIN_DEFAULT_TAB,
  AFFILIATE_ADMIN_TAB_IDS,
  parseAffiliateAdminTab,
  type AffiliateAdminTab,
} from './admin-tabs';

export function AffiliateAdminApp() {
  const t = useTranslations('account.affiliateAdmin');
  const tAccount = useTranslations('account');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isChecking } = useRequireSession();
  const session = useSession();
  const payoutDialog = useOverlayState();
  const [payoutPartnerId, setPayoutPartnerId] = useState<string | null>(null);
  const tab = parseAffiliateAdminTab(searchParams.get('tab'));

  useEffect(() => {
    if (session.data && session.data.role !== 'admin') {
      router.replace(AFFILIATE_ACCOUNT_HREF);
    }
  }, [session.data, router]);

  if (isChecking || session.isLoading || session.data?.role !== 'admin') {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center">
        <Spinner aria-label={tAccount('loading')} />
      </div>
    );
  }

  function selectTab(next: AffiliateAdminTab) {
    router.replace(
      next === AFFILIATE_ADMIN_DEFAULT_TAB
        ? AFFILIATE_ADMIN_HREF
        : `${AFFILIATE_ADMIN_HREF}?tab=${next}`,
      { scroll: false }
    );
  }

  function openPayoutDialog(partnerId: string | null) {
    setPayoutPartnerId(partnerId);
    payoutDialog.open();
  }

  function renderPanel() {
    switch (tab) {
      case 'affiliates':
        return <AffiliateAdminPartnersPanel onCreatePayout={openPayoutDialog} />;
      case 'referrals':
        return <AffiliateAdminReferralsPanel />;
      case 'payouts':
        return (
          <AffiliateAdminPayoutsPanel
            onCreatePayout={() => {
              openPayoutDialog(null);
            }}
          />
        );
      default:
        return <AffiliateAdminApplicationsPanel />;
    }
  }

  return (
    <PolicyDetailPageShell backHref="/account" backLabel={t('back')} showUserName>
      <div className="flex w-full flex-col gap-0">
        <Tabs
          variant="secondary"
          selectedKey={tab}
          onSelectionChange={(key) => {
            selectTab(parseAffiliateAdminTab(String(key)));
          }}
          className="w-full gap-0"
        >
          <div className="border-border flex flex-col gap-10 border-b px-4 pt-10 sm:px-8">
            <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>
            <Tabs.ListContainer className="overflow-x-auto !px-0">
              <Tabs.List aria-label={t('tabsAriaLabel')} className={SECONDARY_TABS_LIST_CLASS}>
                {AFFILIATE_ADMIN_TAB_IDS.map((id) => (
                  <Tabs.Tab key={id} id={id} className={SECONDARY_TABS_TAB_CLASS}>
                    <span className="text-base font-medium whitespace-nowrap">
                      {t(`tabs.${id}`)}
                    </span>
                    <Tabs.Indicator className={SECONDARY_TABS_INDICATOR_CLASS} />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </div>
        </Tabs>

        <div className="min-w-0 overflow-x-clip">
          <AnimatedServiceTabContent tabKey={tab} tabOrder={AFFILIATE_ADMIN_TAB_IDS}>
            {renderPanel()}
          </AnimatedServiceTabContent>
        </div>
      </div>

      <AffiliateCreatePayoutDialog state={payoutDialog} initialPartnerId={payoutPartnerId} />
    </PolicyDetailPageShell>
  );
}
