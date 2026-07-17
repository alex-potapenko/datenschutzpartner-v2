'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, cn } from '@/components/ui';
import { AccountSectionFrame, ACCOUNT_TAB_PANEL_CLASS } from '../account-ui';
import { DocumentsSection } from './DocumentsSection';
import { GeneratorPaymentsPanel } from './GeneratorPaymentsPanel';

const GENERATOR_TAB_IDS = ['policies', 'payments'] as const;
type GeneratorTab = (typeof GENERATOR_TAB_IDS)[number];

export function GeneratorSection({
  onNavigateToAccountDetails,
}: {
  onNavigateToAccountDetails?: () => void;
} = {}) {
  const t = useTranslations('account.generator');
  const [tab, setTab] = useState<GeneratorTab>('policies');

  return (
    <AccountSectionFrame
      title={t('title')}
      tabsAriaLabel={t('tabsAriaLabel')}
      tabs={GENERATOR_TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) }))}
      selectedTab={tab}
      onTabChange={(key) => {
        setTab(key as GeneratorTab);
      }}
    >
      <Tabs.Panel id="policies" className={ACCOUNT_TAB_PANEL_CLASS}>
        <DocumentsSection />
      </Tabs.Panel>
      <Tabs.Panel
        id="payments"
        className={cn(ACCOUNT_TAB_PANEL_CLASS, 'flex min-h-0 flex-1 flex-col')}
      >
        <GeneratorPaymentsPanel onManagePayment={onNavigateToAccountDetails} />
      </Tabs.Panel>
    </AccountSectionFrame>
  );
}
