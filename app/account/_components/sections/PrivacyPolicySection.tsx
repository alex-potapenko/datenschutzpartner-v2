'use client';

import { useMemo, useState, type Key } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  GENERATOR_FAQ_CATEGORY_IDS,
  GENERATOR_FAQ_ITEMS_BY_CATEGORY,
} from '@/lib/faq-content/constants';
import { isActiveSubscription, useSubscriptions } from '@/api/billing';
import { Button, Plus, Spinner } from '@/components/ui';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
import { GeneratorServiceLanding } from '@/components/shared/GeneratorServiceLanding';
import { PolicyDocumentMain } from '@/components/shared/PolicyDocument';
import { PolicyImplementationGuide } from '@/components/shared/PolicyImplementationGuide';
import { AccountSection, AccountSectionFrame } from '../account-ui';
import { AccountCheckoutBanner } from '../AccountCheckoutBanner';
import { MembershipPanel } from './MembershipPanel';
import { AnimatedServiceTabContent, useServiceTabs, type ServiceTabId } from './service-tabs';
import { useSiteScope } from '@/components/shared/site-scope';
import { usePendingCheckout } from '@/api/checkout';

/** The hosted policy adds a `preview` tab for the document text itself. */
const POLICY_TAB_IDS = [
  'subscription',
  'instructions',
  'preview',
  'faq',
] as const satisfies readonly ServiceTabId[];

function GeneratorFaqPanel() {
  const t = useTranslations('generatorFaq');

  const sections = useMemo(
    () =>
      GENERATOR_FAQ_CATEGORY_IDS.map((categoryId) => ({
        id: categoryId,
        label: t(`categories.${categoryId}.label`),
        items: GENERATOR_FAQ_ITEMS_BY_CATEGORY[categoryId].map((itemId) => ({
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

export function PrivacyPolicySection() {
  const t = useTranslations('account.privacyPolicy');
  const tTabs = useTranslations('account.serviceTabs');
  const router = useRouter();
  const { activeSite, isLoading: sitesLoading } = useSiteScope();
  const subscriptions = useSubscriptions();
  const pendingCheckout = usePendingCheckout(activeSite?.document ? activeSite.domain : null);
  const tabs = useServiceTabs(POLICY_TAB_IDS);
  const [tab, setTab] = useState<ServiceTabId>('subscription');

  const document = activeSite?.document;
  const policySubscription = useMemo(() => {
    if (!document?.subscriptionId) return null;
    return (subscriptions.data ?? []).find((row) => row.id === document.subscriptionId) ?? null;
  }, [document?.subscriptionId, subscriptions.data]);

  const hasActivePolicy = Boolean(document && isActiveSubscription(policySubscription));
  const isLoading = sitesLoading || subscriptions.isLoading;

  if (isLoading) {
    return (
      <AccountSectionFrame
        title={t('title')}
        content={
          <div className="flex min-h-48 items-center justify-center py-12" aria-busy="true">
            <Spinner aria-label={t('loading')} />
          </div>
        }
      />
    );
  }

  if (!activeSite) {
    return (
      <AccountSectionFrame
        title={t('title')}
        content={
          <div className="-mx-4 sm:-mx-8">
            <div className="flex flex-col items-start gap-5 px-6 py-16 sm:px-8">
              <h2 className="text-foreground max-w-xl text-2xl font-bold">{t('empty.title')}</h2>
              <p className="text-muted max-w-xl text-base leading-relaxed">{t('empty.body')}</p>
              <Button
                variant="primary"
                size="md"
                className="gap-2"
                onPress={() => {
                  router.push('/scan');
                }}
              >
                <Plus size={18} weight="bold" aria-hidden />
                {t('empty.cta')}
              </Button>
            </div>
          </div>
        }
      />
    );
  }

  if (!hasActivePolicy || !document) {
    return (
      <AccountSectionFrame
        hideTitle
        content={
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            <GeneratorServiceLanding domain={activeSite.domain} />
          </div>
        }
      />
    );
  }

  return (
    <AccountSectionFrame
      title={t('title')}
      tabs={tabs}
      tabsAriaLabel={tTabs('ariaLabel')}
      selectedTab={tab}
      onTabChange={(key: Key) => {
        setTab(key as ServiceTabId);
      }}
    >
      <AnimatedServiceTabContent tabKey={tab} tabOrder={POLICY_TAB_IDS}>
        {tab === 'instructions' ? (
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            <PolicyImplementationGuide document={document} />
          </div>
        ) : null}

        {tab === 'preview' ? (
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            <PolicyDocumentMain document={document} />
          </div>
        ) : null}

        {tab === 'subscription' ? (
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            {pendingCheckout.data?.needed && document.subscriptionId ? (
              <AccountCheckoutBanner
                siteDomain={activeSite.domain}
                subscriptionId={document.subscriptionId}
              />
            ) : (
              <MembershipPanel
                productType="policy"
                subscriptionId={document.subscriptionId}
                hideSidebar
                hidePlanHeader={false}
              />
            )}
          </div>
        ) : null}

        {tab === 'faq' ? (
          <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
            <GeneratorFaqPanel />
          </div>
        ) : null}
      </AnimatedServiceTabContent>
    </AccountSectionFrame>
  );
}
