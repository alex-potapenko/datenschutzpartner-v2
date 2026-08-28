'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useDocuments,
  groupDocumentsBySubscription,
  resolveDocumentLegalEntity,
  resolveDocumentSite,
  useGeneratorPlan,
} from '@/api/documents';
import {
  countActivePolicySubscriptions,
  listPolicySubscriptions,
  resolvePolicySiteCount,
  useSubscriptions,
} from '@/api/billing';
import { fillPolicySlotScanHref } from '@/app/account/_components/account-sections';
import { useEuRepContracts } from '@/api/eu-rep';
import { Globe, Plus, ShoppingCart, Button, Table } from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import {
  AccountSection,
  AccountTable,
  DataState,
  DaysLeftDonut,
  EmptyState,
  PolicyDetailTableRow,
  PolicyTableRowCaret,
  SubscriptionIdLink,
  TableRowAction,
  subscriptionDaysLeft,
  useDateFormatter,
} from '../account-ui';

function EmptySlotRow({ subscriptionId }: { subscriptionId: string }) {
  const t = useTranslations('account.documents');
  const router = useRouter();

  return (
    <Table.Row className="[&_.table__cell]:!bg-surface">
      <Table.Cell colSpan={5} className="p-1.5">
        <button
          type="button"
          onClick={() => {
            router.push(fillPolicySlotScanHref(subscriptionId));
          }}
          className="border-border text-accent hover:border-accent/50 hover:bg-accent/5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-1.5 text-sm font-medium no-underline transition-colors"
        >
          <Plus size={16} weight="bold" aria-hidden className="text-accent shrink-0" />
          {t('addSite')}
        </button>
      </Table.Cell>
    </Table.Row>
  );
}

function NoSitesPlaceholderRow() {
  const t = useTranslations('account.documents');

  return (
    <Table.Row className="[&_.table__cell]:!bg-surface">
      <Table.Cell colSpan={5} className="p-1.5">
        <div
          role="status"
          className="border-border text-muted flex w-full items-center justify-center rounded-lg border border-dashed p-1.5 text-sm font-medium"
        >
          {t('noSitesInSubscription')}
        </div>
      </Table.Cell>
    </Table.Row>
  );
}

function DocumentTable({ tableLabel }: { tableLabel: string }) {
  const t = useTranslations('account.documents');
  const ts = useTranslations('account.status');
  const formatDate = useDateFormatter();
  const documents = useDocuments();
  const subscriptions = useSubscriptions();
  const contracts = useEuRepContracts();

  const groups = useMemo(
    () => groupDocumentsBySubscription(documents.data ?? [], subscriptions.data ?? []),
    [documents.data, subscriptions.data]
  );

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => {
        const period =
          group.subscription?.startDate && group.subscription.nextPaymentDate
            ? subscriptionDaysLeft(group.subscription.startDate, group.subscription.nextPaymentDate)
            : null;
        const daysLeftLabel = period ? t('daysLeft', { count: period.remainingDays }) : null;
        const isInactiveSubscription =
          group.subscription?.status === 'cancelled' || group.subscription?.status === 'expired';
        const showNoSitesPlaceholder = isInactiveSubscription && group.documents.length === 0;

        return (
          <div key={group.subscriptionId || 'none'} className="flex flex-col gap-3">
            <div className="flex min-w-0 items-center justify-between gap-3 px-5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {group.subscriptionId ? (
                  <SubscriptionIdLink
                    id={group.subscriptionId}
                    className="text-foreground font-semibold"
                  >
                    {t('subscriptionGroup', { id: group.subscriptionId })}
                  </SubscriptionIdLink>
                ) : (
                  <p className="text-foreground text-sm font-semibold">
                    {t('subscriptionGroupUnknown')}
                  </p>
                )}
                {group.subscription ? (
                  <StatusPill tone={statusTone(group.subscription.status)}>
                    {ts(group.subscription.status)}
                  </StatusPill>
                ) : null}
              </div>
              {group.subscription ? (
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-muted text-sm">
                    {t('subscriptionSites', { count: resolvePolicySiteCount(group.subscription) })}
                  </p>
                  {period && daysLeftLabel ? (
                    <>
                      <span className="text-muted text-sm" aria-hidden>
                        ·
                      </span>
                      <p className="text-muted text-sm">{daysLeftLabel}</p>
                      <DaysLeftDonut
                        remaining={period.remainingDays}
                        total={period.totalDays}
                        label={daysLeftLabel}
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
            <AccountTable
              aria-label={`${tableLabel} ${group.subscriptionId || t('subscriptionGroupUnknown')}`}
            >
              <Table.Header>
                <Table.Column isRowHeader>{t('colSite')}</Table.Column>
                <Table.Column>{t('colLegalEntity')}</Table.Column>
                <Table.Column className="text-right">{t('colCreated')}</Table.Column>
                <Table.Column className="text-right">{t('colUpdated')}</Table.Column>
                <Table.Column className="text-right">
                  <span className="sr-only">{t('colActions')}</span>
                </Table.Column>
              </Table.Header>
              <Table.Body>
                {group.documents.map((doc) => {
                  const site = resolveDocumentSite(doc);
                  const legalEntity = resolveDocumentLegalEntity(doc, contracts.data ?? []);
                  const hasEuRep = Boolean(doc.euRepContractId || doc.euRepLinked);
                  return (
                    <PolicyDetailTableRow key={doc.id} documentId={doc.id} openLabel={t('open')}>
                      <Table.Cell>
                        <TableRowAction>
                          <NavigationLink
                            href={`https://${site}`}
                            size="sm"
                            chevron="none"
                            className="inline-flex items-center gap-2 font-medium"
                          >
                            <Globe size={18} className="text-accent shrink-0" aria-hidden />
                            {site}
                          </NavigationLink>
                        </TableRowAction>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-foreground">{legalEntity || '—'}</span>
                          {hasEuRep ? (
                            <StatusPill
                              tone="neutral"
                              className="[--chip-bg:color-mix(in_srgb,var(--feature-purple)_14%,var(--background))] [--chip-fg:var(--feature-purple)]"
                            >
                              {t('euRepBadge')}
                            </StatusPill>
                          ) : null}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="text-right">{formatDate(doc.createdDate)}</Table.Cell>
                      <Table.Cell className="text-right">{formatDate(doc.updatedDate)}</Table.Cell>
                      <Table.Cell className="text-right">
                        <PolicyTableRowCaret label={t('open')} />
                      </Table.Cell>
                    </PolicyDetailTableRow>
                  );
                })}
                {showNoSitesPlaceholder ? (
                  <NoSitesPlaceholderRow />
                ) : (
                  Array.from({ length: group.emptySlotCount }, (_, index) => (
                    <EmptySlotRow
                      key={`${group.subscriptionId}-empty-${index}`}
                      subscriptionId={group.subscriptionId}
                    />
                  ))
                )}
              </Table.Body>
            </AccountTable>
          </div>
        );
      })}
    </div>
  );
}

function StatsCountSection({
  title,
  count,
  action,
}: {
  title: string;
  count: number;
  action?: ReactNode;
}) {
  return (
    <AccountSection title={title} className="min-w-0 flex-1 gap-4" contentClassName="gap-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <PriceBlock amount={String(count)} animatedAmount={count} className="min-w-0" />
        {action}
      </div>
    </AccountSection>
  );
}

function PolicyStatsRow({
  createdCount,
  availableCount,
  subscriptionCount,
  onBuy,
}: {
  createdCount: number;
  availableCount: number;
  subscriptionCount: number;
  onBuy: () => void;
}) {
  const t = useTranslations('account.documents');

  return (
    <div className="border-border divide-border flex flex-col divide-y border-b sm:flex-row sm:divide-x sm:divide-y-0">
      <StatsCountSection title={t('countTitle')} count={createdCount} />
      <StatsCountSection title={t('subscriptionCountTitle')} count={subscriptionCount} />
      <StatsCountSection
        title={t('availableCountTitle')}
        count={availableCount}
        action={
          <Button variant="outline" size="sm" className="shrink-0 gap-2" onPress={onBuy}>
            <ShoppingCart size={14} weight="bold" aria-hidden />
            {t('buy')}
          </Button>
        }
      />
    </div>
  );
}

export function DocumentsSection() {
  const t = useTranslations('account.documents');
  const router = useRouter();
  const documents = useDocuments();
  const subscriptions = useSubscriptions();
  const generatorPlan = useGeneratorPlan();

  const policySubscriptionCount = countActivePolicySubscriptions(subscriptions.data ?? []);
  const hasPolicySubscriptions = listPolicySubscriptions(subscriptions.data ?? []).length > 0;
  const availableSiteSlots = generatorPlan.data?.availableSiteSlots ?? 0;

  const goToScan = () => {
    router.push('/scan');
  };

  const goToBuyMoreSites = () => {
    router.push('/account/generator/checkout');
  };

  return (
    <DataState
      isLoading={documents.isLoading || subscriptions.isLoading || generatorPlan.isLoading}
      isError={documents.isError}
      onRetry={() => {
        void documents.refetch();
        void subscriptions.refetch();
        void generatorPlan.refetch();
      }}
    >
      {documents.data && subscriptions.data ? (
        <div className="divide-border flex flex-col divide-y">
          <PolicyStatsRow
            createdCount={documents.data.length}
            availableCount={availableSiteSlots}
            subscriptionCount={policySubscriptionCount}
            onBuy={goToBuyMoreSites}
          />

          <AccountSection contentClassName="gap-8">
            {!hasPolicySubscriptions ? (
              <EmptyState
                message={t('empty')}
                action={
                  <Button variant="primary" size="md" className="gap-2" onPress={goToScan}>
                    <Plus size={18} weight="bold" />
                    {t('emptyCta')}
                  </Button>
                }
              />
            ) : (
              <DocumentTable tableLabel={t('listTitle')} />
            )}
          </AccountSection>
        </div>
      ) : null}
    </DataState>
  );
}
