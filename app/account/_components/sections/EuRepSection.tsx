'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, Wrench } from '@/components/ui';
import { AccountSectionFrame, ACCOUNT_TAB_PANEL_CLASS } from '../account-ui';
import { SubscriptionPanel } from './SubscriptionPanel';

const EU_REP_TAB_IDS = ['inquiries', 'subscription'] as const;
type EuRepTab = (typeof EU_REP_TAB_IDS)[number];

function InquiriesStub() {
  const t = useTranslations('account.euRep.inquiries');

  return (
    <div className="border-border flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center">
      <div className="bg-accent-soft text-accent flex size-12 items-center justify-center rounded-full">
        <Wrench size={22} weight="fill" aria-hidden />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-foreground text-base font-semibold">{t('comingSoonTitle')}</p>
        <p className="text-muted max-w-sm text-sm leading-relaxed">{t('comingSoonBody')}</p>
      </div>
    </div>
  );
}

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
        <InquiriesStub />
      </Tabs.Panel>
      <Tabs.Panel id="subscription" className={ACCOUNT_TAB_PANEL_CLASS}>
        <SubscriptionPanel productType="euRep" onManagePayment={onNavigateToAccountDetails} />
      </Tabs.Panel>
    </AccountSectionFrame>
  );
}
