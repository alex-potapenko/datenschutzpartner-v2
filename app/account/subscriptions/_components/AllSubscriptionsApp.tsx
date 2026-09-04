'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireSession } from '@/api/auth';
import {
  countActivePolicySites,
  resolvePolicySiteCount,
  useOrders,
  isSubscriptionOnTrial,
  subscriptionCoverageEnd,
  useSubscriptions,
  type Subscription,
} from '@/api/billing';
import { calculateEuRepQuote, calculateGeneratorPolicyQuote } from '@/api/checkout';
import { resolveDocumentSite, useDocuments, uniqueDocumentsBySite } from '@/api/documents';
import { useEuRepContracts } from '@/api/eu-rep';
import { Button, CaretRight, Chip, Spinner, Table, Tabs } from '@/components/ui';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import {
  ALL_SUBSCRIPTIONS_ACCOUNT_HREF,
  euRepAccountHref,
  privacyPolicyAccountHref,
} from '@/lib/account-routes';
import { BillingHistoryTable } from '@/app/account/_components/BillingHistoryTable';
import {
  AccountSection,
  AccountTable,
  DaysLeftDonut,
  formatMoney,
  subscriptionDaysLeft,
  useDateFormatter,
  SECONDARY_TABS_INDICATOR_CLASS,
  SECONDARY_TABS_LIST_CLASS,
  SECONDARY_TABS_TAB_CLASS,
} from '@/app/account/_components/account-ui';
import { AnimatedServiceTabContent } from '@/app/account/_components/sections/service-tabs';
import { isAllSubscriptionsTab, type AllSubscriptionsTab } from './all-subscriptions-tabs';

const RECENT_PAYMENTS_LIMIT = 20;

type ServiceRow = {
  key: string;
  label: string;
  subscription?: Subscription;
  amount?: number;
  manageHref?: string;
};

type BillingProductType = 'policy' | 'euRep';

const TAB_PRODUCT_TYPE: Partial<Record<AllSubscriptionsTab, BillingProductType>> = {
  privacyPolicy: 'policy',
  euRep: 'euRep',
};

export function AllSubscriptionsApp() {
  const t = useTranslations('account.allSubscriptions');
  const tSubs = useTranslations('account.subscriptions');
  const tNav = useTranslations('account.nav');
  const tDashboard = useTranslations('account.dashboard');
  const tStatus = useTranslations('account.status');
  const tDocuments = useTranslations('account.documents');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const formatDate = useDateFormatter();

  const tabParam = searchParams.get('tab');
  const tabFromUrl: AllSubscriptionsTab = isAllSubscriptionsTab(tabParam)
    ? tabParam
    : 'privacyPolicy';
  const [tab, setTab] = useState<AllSubscriptionsTab>(tabFromUrl);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const { isChecking } = useRequireSession(ALL_SUBSCRIPTIONS_ACCOUNT_HREF);
  const subscriptions = useSubscriptions();
  const orders = useOrders();
  const documents = useDocuments();
  const contracts = useEuRepContracts();

  const isLoading =
    isChecking ||
    subscriptions.isLoading ||
    orders.isLoading ||
    documents.isLoading ||
    contracts.isLoading;

  const activeSiteCount = countActivePolicySites(subscriptions.data ?? []);

  const policyRows: ServiceRow[] = uniqueDocumentsBySite(documents.data ?? []).map((document) => {
    const subscription = subscriptions.data?.find((row) => row.id === document.subscriptionId);
    return {
      key: document.id,
      label: resolveDocumentSite(document),
      subscription,
      amount: subscription
        ? calculateGeneratorPolicyQuote(activeSiteCount, resolvePolicySiteCount(subscription))
            .amountDue
        : undefined,
      manageHref: privacyPolicyAccountHref({
        site: resolveDocumentSite(document),
        tab: 'subscription',
      }),
    };
  });

  const euRepRows: ServiceRow[] = (contracts.data ?? []).map((contract) => {
    const subscription = subscriptions.data?.find((row) => row.id === contract.subscriptionId);
    return {
      key: contract.id,
      label: contract.legalEntity,
      subscription,
      amount: subscription
        ? calculateEuRepQuote(subscription.planId ?? 'basis').amountDue
        : undefined,
      manageHref: euRepAccountHref({ contract: contract.id, tab: 'subscription' }),
    };
  });

  const visibleTabs = useMemo((): AllSubscriptionsTab[] => {
    const tabs: AllSubscriptionsTab[] = [];
    const hasPolicySubscriptions = (subscriptions.data ?? []).some(
      (row) => row.productType === 'policy'
    );
    if (hasPolicySubscriptions) tabs.push('privacyPolicy');
    if ((contracts.data ?? []).length > 0) tabs.push('euRep');
    return tabs;
  }, [subscriptions.data, contracts.data]);

  useEffect(() => {
    if (isLoading || visibleTabs.length === 0) return;
    if (!visibleTabs.includes(tab)) {
      const next = visibleTabs[0] ?? 'privacyPolicy';
      setTab(next);
      router.replace(
        next === 'privacyPolicy'
          ? ALL_SUBSCRIPTIONS_ACCOUNT_HREF
          : `${ALL_SUBSCRIPTIONS_ACCOUNT_HREF}?tab=${next}`,
        { scroll: false }
      );
    }
  }, [isLoading, visibleTabs, tab, router]);

  const recentOrders =
    orders.data
      ?.slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, RECENT_PAYMENTS_LIMIT) ?? [];

  const renewalRows =
    subscriptions.data?.filter((row) => row.status === 'active' && row.nextPaymentDate) ?? [];

  function selectTab(next: AllSubscriptionsTab) {
    setTab(next);
    router.replace(
      next === 'privacyPolicy'
        ? ALL_SUBSCRIPTIONS_ACCOUNT_HREF
        : `${ALL_SUBSCRIPTIONS_ACCOUNT_HREF}?tab=${next}`,
      { scroll: false }
    );
  }

  function tabLabel(id: AllSubscriptionsTab) {
    return tNav(id);
  }

  function renderRows(
    rows: ServiceRow[],
    ariaLabel: string,
    primaryColumnLabel: string,
    options?: {
      showStatus?: boolean;
      showRenewalDate?: boolean;
      footerTotal?: { amount: number; currency: string };
    }
  ) {
    const showStatus = options?.showStatus ?? true;
    const showRenewalDate = options?.showRenewalDate ?? false;
    const footerTotal = options?.footerTotal;
    if (rows.length === 0) {
      return <p className="text-muted px-1 py-4 text-sm">{t('serviceEmpty')}</p>;
    }

    return (
      <>
        <AccountTable aria-label={ariaLabel}>
          <Table.Header>
            <Table.Column isRowHeader>{primaryColumnLabel}</Table.Column>
            {showStatus ? <Table.Column>{tSubs('colStatus')}</Table.Column> : null}
            <Table.Column className="text-right">{tSubs('colDays')}</Table.Column>
            <Table.Column className="text-right">{tSubs('colAmount')}</Table.Column>
            {showRenewalDate ? (
              <Table.Column className="text-right">{t('colRenewal')}</Table.Column>
            ) : null}
            <Table.Column className="text-right">
              <span className="sr-only">{tSubs('colActions')}</span>
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => {
              const subscription = row.subscription;
              const coverageEnd = subscriptionCoverageEnd(subscription);
              const period =
                subscription?.startDate && coverageEnd
                  ? subscriptionDaysLeft(subscription.startDate, coverageEnd)
                  : null;
              const daysLeftLabel = period
                ? tDocuments('daysLeft', { count: period.remainingDays })
                : null;

              return (
                <Table.Row key={row.key}>
                  <Table.Cell>
                    <span className="text-foreground text-sm font-semibold">{row.label}</span>
                  </Table.Cell>
                  {showStatus ? (
                    <Table.Cell>
                      {subscription ? (
                        <span className="inline-flex w-fit">
                          {isSubscriptionOnTrial(subscription) ? (
                            <MetaBadge kind="trial" className="w-fit">
                              {tNav('trial')}
                            </MetaBadge>
                          ) : (
                            <StatusPill tone={statusTone(subscription.status)} className="w-fit">
                              {tStatus(subscription.status)}
                            </StatusPill>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </Table.Cell>
                  ) : null}
                  <Table.Cell className="text-right">
                    {period && daysLeftLabel ? (
                      <div className="inline-flex items-center justify-end gap-2">
                        <span className="text-foreground text-sm font-normal tabular-nums">
                          {period.remainingDays}
                        </span>
                        <DaysLeftDonut
                          remaining={period.remainingDays}
                          total={period.totalDays}
                          label={daysLeftLabel}
                          variant={
                            subscription && isSubscriptionOnTrial(subscription)
                              ? 'trial'
                              : 'default'
                          }
                        />
                      </div>
                    ) : (
                      <span className="text-muted text-sm">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-right font-normal">
                    {row.amount != null
                      ? formatMoney(row.amount, subscription?.totals.currency ?? 'CHF')
                      : '—'}
                  </Table.Cell>
                  {showRenewalDate ? (
                    <Table.Cell className="text-right">
                      {subscription?.nextPaymentDate ? (
                        <span className="text-muted text-sm">
                          {formatDate(subscription.nextPaymentDate)}
                        </span>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </Table.Cell>
                  ) : null}
                  <Table.Cell className="text-right">
                    {row.manageHref ? (
                      <Button
                        variant="outline"
                        size="sm"
                        isIconOnly
                        className="size-8 rounded-full"
                        aria-label={tSubs('manage')}
                        onPress={() => {
                          router.push(row.manageHref!);
                        }}
                      >
                        <CaretRight size={16} weight="bold" aria-hidden />
                      </Button>
                    ) : null}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </AccountTable>
        {footerTotal ? (
          <div className="border-border flex items-center justify-between gap-3 border-t px-1 pt-4 text-sm">
            <span className="text-foreground font-semibold">
              {tDashboard('renewals.totalNext12Months')}
            </span>
            <span className="text-foreground font-semibold">
              {formatMoney(footerTotal.amount, footerTotal.currency)}
            </span>
          </div>
        ) : null}
      </>
    );
  }

  function renewalAmount(row: Subscription) {
    return calculateGeneratorPolicyQuote(activeSiteCount, resolvePolicySiteCount(row)).amountDue;
  }

  function renderServiceTabPanel() {
    const productType = TAB_PRODUCT_TYPE[tab];
    const tabOrders = productType
      ? recentOrders.filter((order) => order.productType === productType)
      : [];
    const policyRenewalTotal = renewalRows
      .filter((row) => row.productType === 'policy')
      .reduce((sum, row) => sum + renewalAmount(row), 0);
    const policyRenewalCurrency =
      renewalRows.find((row) => row.productType === 'policy')?.totals.currency ?? 'CHF';

    return (
      <div className="divide-border flex min-w-0 flex-col divide-y">
        <AccountSection
          title={tab === 'privacyPolicy' ? t('websitesTitle') : t('colLegalEntity')}
          titleAside={
            <Chip variant="soft" size="sm" color="default">
              {tab === 'privacyPolicy' ? activeSiteCount : (contracts.data?.length ?? 0)}
            </Chip>
          }
          contentClassName={tab === 'privacyPolicy' ? 'gap-4' : 'gap-0'}
        >
          {tab === 'privacyPolicy'
            ? renderRows(policyRows, tNav('privacyPolicy'), t('colWebsite'), {
                showStatus: false,
                showRenewalDate: true,
                footerTotal:
                  policyRows.length > 0
                    ? { amount: policyRenewalTotal, currency: policyRenewalCurrency }
                    : undefined,
              })
            : renderRows(euRepRows, tNav('euRep'), t('colLegalEntity'))}
        </AccountSection>

        {productType ? (
          <AccountSection title={tDashboard('recentPayments.title')} contentClassName="gap-0">
            {tabOrders.length > 0 ? (
              <BillingHistoryTable
                orders={tabOrders}
                ariaLabel={tDashboard('recentPayments.title')}
                showServiceColumn
                getServiceLabel={(order) =>
                  tDashboard(`recentPayments.services.${order.productType}`)
                }
              />
            ) : (
              <p className="text-muted text-sm">{tSubs('empty')}</p>
            )}
          </AccountSection>
        ) : null}
      </div>
    );
  }

  return (
    <PolicyDetailPageShell backHref="/account" backLabel={tCommon('back')} showUserName>
      <div className="flex w-full flex-col gap-0">
        {visibleTabs.length > 0 ? (
          <Tabs
            variant="secondary"
            selectedKey={tab}
            onSelectionChange={(key) => {
              selectTab(key as AllSubscriptionsTab);
            }}
            className="w-full gap-0"
          >
            <div className="border-border flex flex-col gap-10 border-b px-4 pt-10 sm:px-8">
              <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>
              <Tabs.ListContainer className="overflow-x-auto !px-0">
                <Tabs.List aria-label={t('tabsAriaLabel')} className={SECONDARY_TABS_LIST_CLASS}>
                  {visibleTabs.map((id) => (
                    <Tabs.Tab key={id} id={id} className={SECONDARY_TABS_TAB_CLASS}>
                      <span className="text-base font-medium whitespace-nowrap">
                        {tabLabel(id)}
                      </span>
                      <Tabs.Indicator className={SECONDARY_TABS_INDICATOR_CLASS} />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>
            </div>
          </Tabs>
        ) : (
          <div className="border-border border-b px-4 pt-10 pb-6 sm:px-8">
            <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center py-20" aria-busy="true">
            <Spinner aria-label={tSubs('loading')} />
          </div>
        ) : visibleTabs.length === 0 ? (
          <AccountSection>
            <p className="text-muted text-sm">{tSubs('empty')}</p>
          </AccountSection>
        ) : (
          <div className="min-w-0 overflow-x-clip">
            <AnimatedServiceTabContent tabKey={tab} tabOrder={visibleTabs}>
              {renderServiceTabPanel()}
            </AnimatedServiceTabContent>
          </div>
        )}
      </div>
    </PolicyDetailPageShell>
  );
}
