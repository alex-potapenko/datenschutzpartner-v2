'use client';

import { useTranslations } from 'next-intl';
import { Tabs, cn } from '@/components/ui';
import { AccountSectionFrame, ACCOUNT_TAB_PANEL_CLASS } from '../account-ui';
import { PaymentDetailsSection } from './PaymentDetailsSection';
import { ProfileSection } from './ProfileSection';

export const ACCOUNT_DETAILS_TAB_IDS = ['profile', 'paymentDetails'] as const;
export type AccountDetailsTab = (typeof ACCOUNT_DETAILS_TAB_IDS)[number];

export function isAccountDetailsTab(value: string | null): value is AccountDetailsTab {
  return value !== null && (ACCOUNT_DETAILS_TAB_IDS as readonly string[]).includes(value);
}

export function readAccountDetailsTabFromUrl(): AccountDetailsTab {
  if (typeof window === 'undefined') return 'profile';
  const value = new URLSearchParams(window.location.search).get('tab');
  return isAccountDetailsTab(value) ? value : 'profile';
}

export function AccountDetailsSection({
  tab,
  onTabChange,
}: {
  tab: AccountDetailsTab;
  onTabChange: (tab: AccountDetailsTab) => void;
}) {
  const t = useTranslations('account.accountDetails');

  return (
    <AccountSectionFrame
      title={t('title')}
      tabsAriaLabel={t('tabsAriaLabel')}
      tabs={ACCOUNT_DETAILS_TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) }))}
      selectedTab={tab}
      onTabChange={(key) => {
        onTabChange(key as AccountDetailsTab);
      }}
    >
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
    </AccountSectionFrame>
  );
}
