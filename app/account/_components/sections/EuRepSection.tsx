'use client';

import { useMemo, useState, type Key } from 'react';
import { useTranslations } from 'next-intl';
import { EU_REP_FAQ_CATEGORY_IDS, EU_REP_FAQ_ITEMS_BY_CATEGORY } from '@/lib/faq-content/constants';
import {
  useSubscriptions,
  isEuRepSubscriptionOnTrial,
  isPolicySubscriptionOnTrial,
} from '@/api/billing';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
import { EuRepServiceLanding } from '@/components/shared/EuRepServiceLanding';
import { EuRepDeleteEntityAction } from '@/app/account/_components/EuRepDeleteEntityAction';
import { canDeleteEuRepEntity, useEuRepContracts } from '@/api/eu-rep';
import { useEuRepScope } from '@/components/shared/eu-rep-scope';
import { Spinner } from '@/components/ui';
import { EU_REP_ACCOUNT_HREF } from '@/lib/account-routes';
import { AccountSection, AccountSectionFrame, subscriptionDaysLeft } from '../account-ui';
import { useDocuments, resolveDocumentSite } from '@/api/documents';
import { usePendingCheckout } from '@/api/checkout';
import { EuRepAccountCheckoutBanner } from '../AccountCheckoutBanner';
import { TrialPeriodNotice } from '@/components/shared/TrialPeriodNotice';
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

function buildEuRepQuestionnaireReturnTo(contractId: string | undefined): string {
  const params = new URLSearchParams(EU_REP_ACCOUNT_HREF.split('?')[1] ?? '');
  if (contractId) {
    params.set('contract', contractId);
  }
  return `/account?${params.toString()}`;
}

export function EuRepSection() {
  const t = useTranslations('account.euRep');
  const tTabs = useTranslations('account.serviceTabs');
  const tSubs = useTranslations('account.subscriptions');
  const tDocuments = useTranslations('account.documents');
  const [tab, setTab] = useState<ServiceTabId>('subscription');
  const tabs = useServiceTabs(EU_REP_TAB_IDS);

  const contracts = useEuRepContracts();
  const subscriptions = useSubscriptions();
  const documents = useDocuments();
  const { activeContract } = useEuRepScope();

  const euRepSubscription = useMemo(() => {
    if (!activeContract?.subscriptionId) return null;
    return (
      (subscriptions.data ?? []).find((row) => row.id === activeContract.subscriptionId) ?? null
    );
  }, [activeContract?.subscriptionId, subscriptions.data]);

  const hasEuRepEntity = Boolean(activeContract);
  const canDelete = canDeleteEuRepEntity(euRepSubscription);
  const isLoading = contracts.isLoading || subscriptions.isLoading || documents.isLoading;
  const euRepOnTrial = euRepSubscription ? isEuRepSubscriptionOnTrial(euRepSubscription) : false;
  const euRepTrialPeriod =
    euRepOnTrial && euRepSubscription?.startDate && euRepSubscription.trialEndsAt
      ? subscriptionDaysLeft(euRepSubscription.startDate, euRepSubscription.trialEndsAt)
      : null;

  const linkedPolicySite = useMemo(() => {
    if (!activeContract) return null;
    const entity = activeContract.legalEntity.trim().toLowerCase();
    const linkedPolicy = (documents.data ?? []).find(
      (document) => document.legalEntity?.trim().toLowerCase() === entity && document.subscriptionId
    );
    if (!linkedPolicy) return null;
    const policySubscription = (subscriptions.data ?? []).find(
      (row) => row.id === linkedPolicy.subscriptionId
    );
    if (!policySubscription || !isPolicySubscriptionOnTrial(policySubscription)) return null;
    return resolveDocumentSite(linkedPolicy);
  }, [activeContract, documents.data, subscriptions.data]);

  const pendingCheckoutSite = linkedPolicySite;
  const pendingCheckout = usePendingCheckout(pendingCheckoutSite);
  const showBundledCheckoutBanner = Boolean(
    euRepOnTrial &&
    pendingCheckout.data?.needed &&
    linkedPolicySite &&
    activeContract &&
    euRepSubscription &&
    (pendingCheckout.data.euRepEntities?.length || pendingCheckout.data.euRepEntityCount)
  );

  const questionnaireReturnTo = buildEuRepQuestionnaireReturnTo(activeContract?.id);

  const sectionTitle = activeContract?.legalEntity ?? t('title');

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

  if (!hasEuRepEntity) {
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
      action={
        canDelete && activeContract ? (
          <EuRepDeleteEntityAction
            contractId={activeContract.id}
            entityName={activeContract.legalEntity}
          />
        ) : undefined
      }
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
            {showBundledCheckoutBanner &&
            linkedPolicySite &&
            activeContract &&
            euRepSubscription ? (
              <EuRepAccountCheckoutBanner
                siteDomain={linkedPolicySite}
                policySubscriptionId={
                  (documents.data ?? []).find(
                    (document) =>
                      document.legalEntity?.trim().toLowerCase() ===
                        activeContract.legalEntity.trim().toLowerCase() && document.subscriptionId
                  )?.subscriptionId ?? ''
                }
                contractId={activeContract.id}
                euRepSubscriptionId={euRepSubscription.id}
              />
            ) : (
              <>
                {euRepTrialPeriod ? (
                  <div className="px-6 pt-6 pb-4 sm:px-8">
                    <TrialPeriodNotice
                      variant="euRep"
                      showTitle={false}
                      daysLeft={euRepTrialPeriod}
                      daysLeftAriaLabel={tDocuments('daysLeft', {
                        count: euRepTrialPeriod.remainingDays,
                      })}
                    />
                  </div>
                ) : null}
                <MembershipPanel
                  productType="euRep"
                  subscriptionId={activeContract?.subscriptionId}
                  hideSidebar
                />
              </>
            )}
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
