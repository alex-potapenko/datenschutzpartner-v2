'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRequireSession } from '@/api/auth';
import { Spinner, Tabs, cn } from '@/components/ui';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { ACCOUNT_DETAILS_HREF } from '@/lib/account-routes';
import {
  ACCOUNT_TAB_PANEL_CLASS,
  SECONDARY_TABS_INDICATOR_CLASS,
  SECONDARY_TABS_LIST_CLASS,
  SECONDARY_TABS_TAB_CLASS,
} from '@/app/account/_components/account-ui';
import { PaymentDetailsSection } from '@/app/account/_components/sections/PaymentDetailsSection';
import { ProfileSection } from '@/app/account/_components/sections/ProfileSection';
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
  const tab: AccountDetailsTab = isAccountDetailsTab(tabParam) ? tabParam : 'profile';

  function selectTab(next: AccountDetailsTab) {
    router.replace(
      next === 'profile' ? ACCOUNT_DETAILS_HREF : `${ACCOUNT_DETAILS_HREF}?tab=${next}`,
      {
        scroll: false,
      }
    );
  }

  return (
    <PolicyDetailPageShell backHref="/account" backLabel={tCommon('back')} detailTitle={t('title')}>
      {isChecking ? (
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      ) : (
        <Tabs
          variant="secondary"
          selectedKey={tab}
          onSelectionChange={(key) => {
            selectTab(key as AccountDetailsTab);
          }}
          className="w-full gap-0"
        >
          <div className="border-border flex flex-col gap-10 border-b px-4 pt-10 sm:px-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>
              <p className="text-muted max-w-2xl text-base leading-relaxed">{t('lead')}</p>
            </div>
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

          <Tabs.Panel
            id="profile"
            className={cn(ACCOUNT_TAB_PANEL_CLASS, 'flex min-h-0 flex-1 flex-col')}
          >
            <ProfileSection />
          </Tabs.Panel>
          <Tabs.Panel
            id="paymentDetails"
            className={cn(ACCOUNT_TAB_PANEL_CLASS, 'flex min-h-0 flex-1 flex-col')}
          >
            <PaymentDetailsSection />
          </Tabs.Panel>
        </Tabs>
      )}
    </PolicyDetailPageShell>
  );
}
