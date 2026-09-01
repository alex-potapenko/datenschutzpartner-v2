'use client';

import { useMemo, useState, type Key } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EU_REP_FAQ_CATEGORY_IDS, EU_REP_FAQ_ITEMS_BY_CATEGORY } from '@/lib/faq-content/constants';
import { isActiveSubscription, useSubscriptions } from '@/api/billing';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
import { EuRepServiceLanding } from '@/components/shared/EuRepServiceLanding';
import {
  isEuRepAccountScope,
  normalizeAccountScope,
} from '@/app/account/_components/account-sections';
import { useEuRepContracts } from '@/api/eu-rep';
import { useEuRepScope } from '@/components/shared/eu-rep-scope';
import { resolveSiteEuRepContract, useSiteScope } from '@/components/shared/site-scope';
import { Spinner } from '@/components/ui';
import { AccountSection, AccountSectionFrame } from '../account-ui';
import { EuRepLegalEntityPanel } from './EuRepLegalEntityPanel';
import { MembershipPanel } from './MembershipPanel';
import {
  AnimatedServiceTabContent,
  EU_REP_TAB_IDS,
  useServiceTabs,
  type ServiceTabId,
} from './service-tabs';

function EuRepFaqPanel() {
  const t = useTranslations('euRepPage.faqSection');

  const sections = useMemo(
    () =>
      EU_REP_FAQ_CATEGORY_IDS.map((categoryId) => ({
        id: categoryId,
        label: t(`categories.${categoryId}.label`),
        items: EU_REP_FAQ_ITEMS_BY_CATEGORY[categoryId].map((itemId) => ({
          id: itemId,
          question: t(`items.${itemId}.question`),
          answer: t(`items.${itemId}.answer`),
        })),
      })),
    [t]
  );

  return (
    <AccountSection contentClassName="gap-6">
      <div className="px-4 py-2 sm:px-8">
        <FaqCategorizedSections sections={sections} className="!mx-0 max-w-none" />
      </div>
    </AccountSection>
  );
}

function buildEuRepQuestionnaireReturnTo(
  accountScope: ReturnType<typeof normalizeAccountScope>,
  siteDomain: string | undefined,
  contractId: string | undefined
): string {
  const params = new URLSearchParams();
  params.set('accountScope', accountScope);
  params.set('section', 'euRep');
  if (siteDomain) {
    params.set('site', siteDomain);
  }
  if (contractId) {
    params.set('contract', contractId);
  }
  return `/account?${params.toString()}`;
}

export function EuRepSection() {
  const t = useTranslations('account.euRep');
  const tTabs = useTranslations('account.serviceTabs');
  const tSubs = useTranslations('account.subscriptions');
  const [tab, setTab] = useState<ServiceTabId>('subscription');
  const tabs = useServiceTabs(EU_REP_TAB_IDS);
  const searchParams = useSearchParams();
  const accountScope = normalizeAccountScope(searchParams.get('accountScope'));
  const inGlobalEuRepScope = isEuRepAccountScope(accountScope);

  const { activeSite } = useSiteScope();
  const contracts = useEuRepContracts();
  const subscriptions = useSubscriptions();
  const { activeContract: globalContract } = useEuRepScope();

  const siteContract = useMemo(
    () => (activeSite ? resolveSiteEuRepContract(activeSite, contracts.data ?? []) : undefined),
    [activeSite, contracts.data]
  );

  const activeContract = inGlobalEuRepScope ? globalContract : siteContract;

  const euRepSubscription = useMemo(() => {
    if (!activeContract?.subscriptionId) return null;
    return (
      (subscriptions.data ?? []).find((row) => row.id === activeContract.subscriptionId) ?? null
    );
  }, [activeContract?.subscriptionId, subscriptions.data]);

  const hasActiveEuRep = Boolean(activeContract && isActiveSubscription(euRepSubscription));
  const isLoading = contracts.isLoading || subscriptions.isLoading;

  const questionnaireReturnTo = buildEuRepQuestionnaireReturnTo(
    accountScope,
    inGlobalEuRepScope ? undefined : activeSite?.domain,
    activeContract?.id
  );

  const sectionTitle =
    inGlobalEuRepScope && activeContract?.legalEntity ? activeContract.legalEntity : t('title');

  if (isLoading) {
    return (
      <AccountSectionFrame
        title={sectionTitle}
        content={
          <div className="flex min-h-48 items-center justify-center py-12" aria-busy="true">
            <Spinner aria-label={tSubs('loading')} />
          </div>
        }
      />
    );
  }

  if (!hasActiveEuRep) {
    return (
      <AccountSectionFrame
        hideTitle
        content={
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            <EuRepServiceLanding
              questionnaireReturnTo={questionnaireReturnTo}
              checkoutReturnTo={questionnaireReturnTo}
            />
          </div>
        }
      />
    );
  }

  return (
    <AccountSectionFrame
      title={sectionTitle}
      tabs={tabs}
      tabsAriaLabel={tTabs('ariaLabel')}
      selectedTab={tab}
      onTabChange={(key: Key) => {
        setTab(key as ServiceTabId);
      }}
    >
      <AnimatedServiceTabContent tabKey={tab} tabOrder={EU_REP_TAB_IDS}>
        {tab === 'subscription' ? (
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            <MembershipPanel
              productType="euRep"
              subscriptionId={activeContract?.subscriptionId}
              hideSidebar
            />
          </div>
        ) : null}

        {tab === 'legalEntity' ? (
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            <EuRepLegalEntityPanel contract={activeContract ?? undefined} />
          </div>
        ) : null}

        {tab === 'faq' ? (
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            <EuRepFaqPanel />
          </div>
        ) : null}
      </AnimatedServiceTabContent>
    </AccountSectionFrame>
  );
}
