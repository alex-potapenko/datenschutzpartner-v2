'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRequireSession } from '@/api/auth';
import { Spinner, Tabs, cn } from '@/components/ui';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { ACCOUNT_DETAILS_HREF } from '@/lib/account-routes';
import {
  SECONDARY_TABS_INDICATOR_CLASS,
  SECONDARY_TABS_LIST_CLASS,
  SECONDARY_TABS_TAB_CLASS,
} from '@/app/account/_components/account-ui';
import { PaymentDetailsSection } from '@/app/account/_components/sections/PaymentDetailsSection';
import { ProfileSection, SettingsSection } from '@/app/account/_components/sections/ProfileSection';
import { AnimatedServiceTabContent } from '@/app/account/_components/sections/service-tabs';
import {
  ACCOUNT_DETAILS_TAB_IDS,
  isAccountDetailsTab,
  type AccountDetailsTab,
} from './account-details-tabs';

export function AccountDetailsApp() {
  const t = useTranslations('account.accountDetails');
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('account');
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isChecking } = useRequireSession(ACCOUNT_DETAILS_HREF);
  const tabParam = searchParams.get('tab');
  const tabFromUrl: AccountDetailsTab = isAccountDetailsTab(tabParam) ? tabParam : 'profile';
  const [tab, setTab] = useState<AccountDetailsTab>(tabFromUrl);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  function selectTab(next: AccountDetailsTab) {
    setTab(next);
    router.replace(
      next === 'profile' ? ACCOUNT_DETAILS_HREF : `${ACCOUNT_DETAILS_HREF}?tab=${next}`,
      {
        scroll: false,
      }
    );
  }

  return (
    <PolicyDetailPageShell backHref="/account" backLabel={tCommon('back')} showUserName>
      {isChecking ? (
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-0">
          <Tabs
            variant="secondary"
            selectedKey={tab}
            onSelectionChange={(key) => {
              selectTab(key as AccountDetailsTab);
            }}
            className="w-full gap-0"
          >
            <div className="border-border flex flex-col gap-10 border-b px-4 pt-10 sm:px-8">
              <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>
              <Tabs.ListContainer className="overflow-x-auto !px-0">
                <Tabs.List aria-label={t('tabsAriaLabel')} className={SECONDARY_TABS_LIST_CLASS}>
                  {ACCOUNT_DETAILS_TAB_IDS.map((id) => (
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

          <AnimatedServiceTabContent
            tabKey={tab}
            tabOrder={ACCOUNT_DETAILS_TAB_IDS}
            className={cn('flex min-h-0 flex-1 flex-col', tab !== 'settings' && 'w-full lg:w-1/2')}
          >
            {tab === 'profile' ? <ProfileSection /> : null}
            {tab === 'paymentDetails' ? <PaymentDetailsSection /> : null}
            {tab === 'settings' ? <SettingsSection /> : null}
          </AnimatedServiceTabContent>
        </div>
      )}
    </PolicyDetailPageShell>
  );
}
