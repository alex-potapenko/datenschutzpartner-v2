'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui';
import { AccountSectionFrame, ACCOUNT_TAB_PANEL_CLASS } from '../account-ui';
import { DocumentsSection } from './DocumentsSection';
import { MembershipPanel } from './MembershipPanel';

const GENERATOR_TAB_IDS = ['policies', 'subscription'] as const;
type GeneratorTab = (typeof GENERATOR_TAB_IDS)[number];

function parseGeneratorTab(value: string | null): GeneratorTab {
  return value === 'subscription' ? 'subscription' : 'policies';
}

export function GeneratorSection({
  onNavigateToAccountDetails,
}: {
  onNavigateToAccountDetails?: () => void;
} = {}) {
  const t = useTranslations('account.generator');
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseGeneratorTab(searchParams.get('tab'));

  return (
    <AccountSectionFrame
      title={t('title')}
      tabsAriaLabel={t('tabsAriaLabel')}
      tabs={GENERATOR_TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) }))}
      selectedTab={tab}
      onTabChange={(key) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('section', 'generator');
        params.set('tab', key);
        router.replace(`/account?${params.toString()}`, { scroll: false });
      }}
    >
      <Tabs.Panel id="policies" className={ACCOUNT_TAB_PANEL_CLASS}>
        <DocumentsSection />
      </Tabs.Panel>
      <Tabs.Panel id="subscription" className={ACCOUNT_TAB_PANEL_CLASS}>
        <MembershipPanel
          productType="policy"
          onManagePayment={() => onNavigateToAccountDetails?.()}
        />
      </Tabs.Panel>
    </AccountSectionFrame>
  );
}
