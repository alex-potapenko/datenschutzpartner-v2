'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui';
import { AccountSectionFrame, ACCOUNT_TAB_PANEL_CLASS } from '../account-ui';
import { InquiriesSection } from './InquiriesSection';
import { MembershipPanel } from './MembershipPanel';

const EU_REP_TAB_IDS = ['inquiries', 'subscription'] as const;
type EuRepTab = (typeof EU_REP_TAB_IDS)[number];

export function EuRepSection({
  onNavigateToAccountDetails,
}: {
  onNavigateToAccountDetails?: () => void;
} = {}) {
  const t = useTranslations('account.euRep');
  const [tab, setTab] = useState<EuRepTab>('inquiries');

  return (
    <AccountSectionFrame
      title={t('title')}
      tabsAriaLabel={t('tabsAriaLabel')}
      tabs={EU_REP_TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) }))}
      selectedTab={tab}
      onTabChange={(key) => {
        setTab(key as EuRepTab);
      }}
    >
      <Tabs.Panel id="inquiries" className={ACCOUNT_TAB_PANEL_CLASS}>
        <InquiriesSection />
      </Tabs.Panel>
      <Tabs.Panel id="subscription" className={ACCOUNT_TAB_PANEL_CLASS}>
        <MembershipPanel
          productType="euRep"
          onManagePayment={() => onNavigateToAccountDetails?.()}
        />
      </Tabs.Panel>
    </AccountSectionFrame>
  );
}
