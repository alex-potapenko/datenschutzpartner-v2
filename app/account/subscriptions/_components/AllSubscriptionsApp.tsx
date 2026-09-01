'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useRequireSession } from '@/api/auth';
import {
  countActivePolicySites,
  resolvePolicySiteCount,
  useOrders,
  useSubscriptions,
  type Subscription,
} from '@/api/billing';
import { calculateEuRepQuote, calculateGeneratorPolicyQuote } from '@/api/checkout';
import { resolveDocumentSite, useDocuments, uniqueDocumentsBySite } from '@/api/documents';
import { useEuRepContracts } from '@/api/eu-rep';
import {
  Buildings,
  Cookie,
  FileText,
  GlobeHemisphereEast,
  Button,
  Question,
  Spinner,
  Table,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { ACCOUNT_BILLING_DETAILS_HREF, ALL_SUBSCRIPTIONS_ACCOUNT_HREF } from '@/lib/account-routes';
import { subscriptionDetailHref } from '@/app/account/_components/account-sections';
import { BillingHistoryTable } from '@/app/account/_components/BillingHistoryTable';
import {
  AccountSection,
  AccountTable,
  formatMoney,
  subscriptionDaysLeft,
  useDateFormatter,
} from '@/app/account/_components/account-ui';

const RECENT_PAYMENTS_LIMIT = 20;

type ServiceRow = {
  key: string;
  website: string;
  detail?: string;
  subscription?: Subscription;
  amount?: number;
};

function ServiceBlock({
  icon,
  accent,
  title,
  aside,
  children,
}: {
  icon: ReactNode;
  accent: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AccountSection contentClassName="gap-0">
      <div className="flex min-w-0 items-center justify-between gap-3 pb-1">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: `color-mix(in oklab, ${accent} 12%, transparent)`,
              color: accent,
            }}
            aria-hidden
          >
            {icon}
          </span>
          <h2 className="text-foreground text-base font-semibold">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </AccountSection>
  );
}

export function AllSubscriptionsApp() {
  const t = useTranslations('account.allSubscriptions');
  const tSubs = useTranslations('account.subscriptions');
  const tMembership = useTranslations('account.membershipPanel');
  const tNav = useTranslations('account.nav');
  const tDashboard = useTranslations('account.dashboard');
  const tStatus = useTranslations('account.status');
  const tDocuments = useTranslations('account.documents');
  const tFooter = useTranslations('footer');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const formatDate = useDateFormatter();

  const { isChecking } = useRequireSession(ALL_SUBSCRIPTIONS_ACCOUNT_HREF);
  const subscriptions = useSubscriptions();
  const orders = useOrders();
  const documents = useDocuments();
  const contracts = useEuRepContracts();

  const isLoading =
    isChecking || subscriptions.isLoading || orders.isLoading || documents.isLoading;

  const sites = uniqueDocumentsBySite(documents.data ?? []);
  const activeSiteCount = countActivePolicySites(subscriptions.data ?? []);

  const policyRows: ServiceRow[] = sites.map((document) => {
    const subscription = subscriptions.data?.find((row) => row.id === document.subscriptionId);
    return {
      key: document.id,
      website: resolveDocumentSite(document),
      subscription,
      amount: subscription
        ? calculateGeneratorPolicyQuote(activeSiteCount, resolvePolicySiteCount(subscription))
            .amountDue
        : undefined,
    };
  });

  const euRepRows: ServiceRow[] = (contracts.data ?? []).flatMap((contract) => {
    const subscription = subscriptions.data?.find((row) => row.id === contract.subscriptionId);
    const amount = subscription
      ? calculateEuRepQuote(subscription.planId ?? 'basis').amountDue
      : undefined;
    const covered = sites.filter((document) => document.euRepContractId === contract.id);

    if (covered.length === 0) {
      return [
        {
          key: contract.id,
          website: '—',
          detail: contract.legalEntity,
          subscription,
          amount,
        },
      ];
    }

    return covered.map((document) => ({
      key: `${contract.id}-${document.id}`,
      website: resolveDocumentSite(document),
      detail: contract.legalEntity,
      subscription,
      amount,
    }));
  });

  const recentOrders =
    orders.data
      ?.slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, RECENT_PAYMENTS_LIMIT) ?? [];

  const renewalRows =
    subscriptions.data?.filter((row) => row.status === 'active' && row.nextPaymentDate) ?? [];

  const renewalTotal = renewalRows.reduce((sum, row) => {
    if (row.productType === 'policy') {
      return (
        sum + calculateGeneratorPolicyQuote(activeSiteCount, resolvePolicySiteCount(row)).amountDue
      );
    }
    return sum + calculateEuRepQuote(row.planId ?? 'basis').amountDue;
  }, 0);
  const renewalCurrency = renewalRows[0]?.totals.currency ?? 'CHF';

  function renderRows(rows: ServiceRow[], ariaLabel: string, detailLabel?: string) {
    if (rows.length === 0) {
      return <p className="text-muted px-1 py-4 text-sm">{t('serviceEmpty')}</p>;
    }

    return (
      <AccountTable aria-label={ariaLabel}>
        <Table.Header>
          <Table.Column isRowHeader>{t('colWebsite')}</Table.Column>
          <Table.Column>{detailLabel ?? tSubs('colPlan')}</Table.Column>
          <Table.Column>{tSubs('colDays')}</Table.Column>
          <Table.Column className="text-right">{tSubs('colAmount')}</Table.Column>
          <Table.Column className="text-right">
            <span className="sr-only">{tSubs('colActions')}</span>
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => {
            const subscription = row.subscription;
            const period =
              subscription?.startDate && subscription.nextPaymentDate
                ? subscriptionDaysLeft(subscription.startDate, subscription.nextPaymentDate)
                : null;

            return (
              <Table.Row key={row.key}>
                <Table.Cell>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-foreground text-sm font-semibold">{row.website}</span>
                    {subscription ? (
                      <StatusPill tone={statusTone(subscription.status)}>
                        {tStatus(subscription.status)}
                      </StatusPill>
                    ) : null}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-muted text-sm">
                    {row.detail ??
                      (subscription
                        ? tMembership(`products.${subscription.productType}.planTitle`)
                        : '—')}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-muted text-sm">
                    {period ? tDocuments('daysLeft', { count: period.remainingDays }) : '—'}
                  </span>
                </Table.Cell>
                <Table.Cell className="text-right font-normal">
                  {row.amount != null
                    ? formatMoney(row.amount, subscription?.totals.currency ?? 'CHF')
                    : '—'}
                </Table.Cell>
                <Table.Cell className="text-right">
                  {subscription ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        router.push(subscriptionDetailHref(subscription.id));
                      }}
                    >
                      {tSubs('manage')}
                    </Button>
                  ) : null}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </AccountTable>
    );
  }

  return (
    <PolicyDetailPageShell backHref="/account" backLabel={tCommon('back')} detailTitle={t('title')}>
      <div className="border-border border-b">
        <div className="flex flex-col gap-2 px-4 pt-10 pb-6 sm:px-8 sm:pb-8">
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center py-20" aria-busy="true">
          <Spinner aria-label={tSubs('loading')} />
        </div>
      ) : (
        <div className="min-w-0 overflow-x-clip">
          <div className="divide-border border-border flex flex-col divide-y border-b">
            <ServiceBlock
              icon={<FileText size={18} weight="fill" />}
              accent="var(--feature-indigo)"
              title={tNav('privacyPolicy')}
              aside={
                <span className="text-muted shrink-0 text-sm">
                  {tSubs('sitesCovered', { count: policyRows.length })}
                </span>
              }
            >
              {renderRows(policyRows, tNav('privacyPolicy'))}
            </ServiceBlock>

            <ServiceBlock
              icon={<GlobeHemisphereEast size={18} weight="fill" />}
              accent="var(--feature-fuchsia)"
              title={tNav('euRep')}
              aside={
                <span className="text-muted shrink-0 text-sm">
                  {tSubs('entitiesCovered', { count: contracts.data?.length ?? 0 })}
                </span>
              }
            >
              {renderRows(euRepRows, tNav('euRep'), t('colLegalEntity'))}
            </ServiceBlock>

            <ServiceBlock
              icon={<Cookie size={18} weight="fill" />}
              accent="var(--feature-yellow)"
              title={tNav('cookieBanner')}
              aside={<MetaBadge kind="soon">{tNav('comingSoon')}</MetaBadge>}
            >
              <ComingSoonRow
                body={t('comingSoonBody')}
                cta={t('comingSoonCta')}
                onPress={() => {
                  router.push('/account?section=cookieBanner');
                }}
              />
            </ServiceBlock>

            <ServiceBlock
              icon={<Buildings size={18} weight="fill" />}
              accent="var(--feature-teal)"
              title={tNav('imprint')}
              aside={<MetaBadge kind="soon">{tNav('comingSoon')}</MetaBadge>}
            >
              <ComingSoonRow
                body={t('comingSoonBody')}
                cta={t('comingSoonCta')}
                onPress={() => {
                  router.push('/account?section=imprint');
                }}
              />
            </ServiceBlock>
          </div>

          <div className="divide-border grid grid-cols-1 divide-y lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
            <div className="divide-border flex min-w-0 flex-col divide-y lg:col-span-2">
              <AccountSection title={tDashboard('recentPayments.title')} contentClassName="gap-0">
                {recentOrders.length > 0 ? (
                  <BillingHistoryTable
                    orders={recentOrders}
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
            </div>

            <div className="divide-border flex min-w-0 flex-col divide-y">
              <AccountSection
                size="small"
                title={tDashboard('renewals.title')}
                contentClassName="gap-4"
              >
                <ul className="flex flex-col gap-4">
                  {renewalRows.map((row) => (
                    <li key={row.id} className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-foreground text-sm font-semibold">{row.product}</span>
                        <span className="text-foreground shrink-0 text-sm font-semibold">
                          {formatMoney(
                            row.productType === 'policy'
                              ? calculateGeneratorPolicyQuote(
                                  activeSiteCount,
                                  resolvePolicySiteCount(row)
                                ).amountDue
                              : calculateEuRepQuote(row.planId ?? 'basis').amountDue,
                            row.totals.currency
                          )}
                        </span>
                      </div>
                      <p className="text-muted text-sm">{formatDate(row.nextPaymentDate)}</p>
                    </li>
                  ))}
                </ul>
                {renewalRows.length > 0 ? (
                  <div className="border-border flex items-center justify-between gap-3 border-t pt-4 text-sm">
                    <span className="text-foreground font-semibold">
                      {tDashboard('renewals.totalNext12Months')}
                    </span>
                    <span className="text-foreground font-semibold">
                      {formatMoney(renewalTotal, renewalCurrency)}
                    </span>
                  </div>
                ) : null}
              </AccountSection>

              <AccountSection
                size="small"
                title={tDashboard('questions.title')}
                icon={<Question size={14} weight="fill" className="shrink-0" aria-hidden />}
              >
                <p className="text-foreground text-sm leading-relaxed">
                  {tDashboard('questions.body')}
                </p>
                <NavigationLink href="/contact" size="sm">
                  {tDashboard('questions.contactUs')}
                </NavigationLink>
              </AccountSection>

              <AccountSection size="small" className="gap-1.5" contentClassName="gap-1.5">
                <NavigationLink href="/terms" size="sm">
                  {tFooter('termsOfService')}
                </NavigationLink>
                <NavigationLink href="/privacy" size="sm">
                  {tFooter('privacyPolicy')}
                </NavigationLink>
                <NavigationLink href={ACCOUNT_BILLING_DETAILS_HREF} size="sm">
                  {tSubs('billingDetails')}
                </NavigationLink>
              </AccountSection>
            </div>
          </div>
        </div>
      )}
    </PolicyDetailPageShell>
  );
}

function ComingSoonRow({ body, cta, onPress }: { body: string; cta: string; onPress: () => void }) {
  return (
    <div className="border-border flex flex-col items-start gap-3 rounded-xl border border-dashed px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted text-sm">{body}</p>
      <Button variant="outline" size="sm" className="shrink-0" onPress={onPress}>
        {cta}
      </Button>
    </div>
  );
}
