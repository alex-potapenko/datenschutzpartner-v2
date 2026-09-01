'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { EU_REP_EXTRA_REQUEST_PRICE, resolveEuRepPlan } from '@/api/checkout';
import { useCreateEuRepExtraRequest, useSubscriptions, type Subscription } from '@/api/billing';
import { resolveDocumentSite, useDocuments, type GeneratedDocument } from '@/api/documents';
import {
  groupEuRepContractsBySubscription,
  useEuRepContracts,
  useUnlinkEuRepDocument,
  type EuRepContract,
} from '@/api/eu-rep';
import {
  euRepContractDetailHref,
  subscriptionDetailHref,
} from '@/app/account/_components/account-sections';
import {
  CaretDown,
  CaretUp,
  Globe,
  LinkSimple,
  Plus,
  ShoppingCart,
  Button,
  Table,
  useOverlayState,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { EuRepLinkPoliciesDialog } from '../EuRepLinkPoliciesDialog';
import { useEuRepScope } from '@/components/shared/eu-rep-scope';
import { useSiteScope, resolveSiteEuRepContract } from '@/components/shared/site-scope';
import { cn } from '@/lib/utils';
import {
  AccountSection,
  AccountTable,
  ConfirmDialog,
  DataState,
  DaysLeftDonut,
  EmptyState,
  TableRowAction,
  subscriptionDaysLeft,
  useDateFormatter,
} from '../account-ui';

type SortKey = 'legalEntity' | 'remainingDays';
type SortDir = 'asc' | 'desc';

function LinkHostedPoliciesRow({ onLink }: { onLink: () => void }) {
  const t = useTranslations('account.euRep.contract');

  return (
    <Table.Row className="[&_.table__cell]:!bg-surface">
      <Table.Cell colSpan={4} className="p-1.5">
        <button
          type="button"
          onClick={onLink}
          className="border-border text-accent hover:border-accent/50 hover:bg-accent/5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-1.5 text-sm font-medium no-underline transition-colors"
        >
          <LinkSimple size={16} weight="bold" aria-hidden className="text-accent shrink-0" />
          {t('linkCta')}
        </button>
      </Table.Cell>
    </Table.Row>
  );
}

function LinkedPolicyTable({
  contractId,
  documents,
  tableLabel,
  canRemove,
  canLink,
  onLink,
}: {
  contractId: string;
  documents: GeneratedDocument[];
  tableLabel: string;
  canRemove: boolean;
  canLink: boolean;
  onLink: () => void;
}) {
  const t = useTranslations('account.documents');
  const tc = useTranslations('account.euRep.contract');
  const formatDate = useDateFormatter();
  const unlink = useUnlinkEuRepDocument();
  const confirm = useOverlayState();
  const [removeTarget, setRemoveTarget] = useState<GeneratedDocument | null>(null);

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await unlink.mutateAsync({ contractId, documentId: removeTarget.id });
      toast.success(tc('removeSuccess'));
      confirm.close();
      setRemoveTarget(null);
    } catch {
      toast.error(tc('removeFailed'));
    }
  }

  return (
    <>
      <AccountTable aria-label={tableLabel}>
        <Table.Header>
          <Table.Column isRowHeader>{t('colSite')}</Table.Column>
          <Table.Column className="text-right">{t('colCreated')}</Table.Column>
          <Table.Column className="text-right">{t('colUpdated')}</Table.Column>
          <Table.Column className="text-right">
            <span className="sr-only">{t('colActions')}</span>
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {documents.map((doc) => {
            const site = resolveDocumentSite(doc);
            return (
              <Table.Row key={doc.id}>
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
                <Table.Cell className="text-right">{formatDate(doc.createdDate)}</Table.Cell>
                <Table.Cell className="text-right">{formatDate(doc.updatedDate)}</Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    {canRemove ? (
                      <TableRowAction>
                        <NavigationLink
                          size="sm"
                          chevron="none"
                          onPress={() => {
                            setRemoveTarget(doc);
                            confirm.open();
                          }}
                        >
                          {tc('removeCta')}
                        </NavigationLink>
                      </TableRowAction>
                    ) : null}
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })}
          {canLink ? <LinkHostedPoliciesRow onLink={onLink} /> : null}
        </Table.Body>
      </AccountTable>

      <ConfirmDialog
        state={confirm}
        title={tc('removeTitle')}
        body={
          removeTarget
            ? tc('removeBody', { site: resolveDocumentSite(removeTarget) })
            : tc('removeBody', { site: '—' })
        }
        confirmLabel={tc('removeConfirm')}
        cancelLabel={tc('removeCancel')}
        onConfirm={() => {
          void handleRemove();
        }}
        isPending={unlink.isPending}
      />
    </>
  );
}

function LinkedPoliciesSecondary({
  groups,
  unlinkedCount,
}: {
  groups: Array<{
    contract: EuRepContract;
    documents: GeneratedDocument[];
    subscription?: Subscription;
  }>;
  unlinkedCount: number;
}) {
  const t = useTranslations('account.euRep.contract');
  const [open, setOpen] = useState(false);
  const linkDialog = useOverlayState();
  const [linkContractId, setLinkContractId] = useState<string | null>(null);

  const activeGroup = groups.find((group) => group.contract.id === linkContractId);

  if (groups.length === 0) return null;

  return (
    <AccountSection contentClassName="gap-4">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="text-foreground hover:bg-key-50 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-2 text-left text-sm font-semibold transition-colors"
        aria-expanded={open}
      >
        <span>{t('linkedSecondaryTitle')}</span>
        {open ? (
          <CaretUp size={16} weight="bold" aria-hidden className="text-muted shrink-0" />
        ) : (
          <CaretDown size={16} weight="bold" aria-hidden className="text-muted shrink-0" />
        )}
      </button>
      {open ? (
        <div className="flex flex-col gap-8">
          <p className="text-muted text-sm">{t('linkedSecondaryBody')}</p>
          {groups.map((group) => {
            const isActive = group.contract.status === 'active';
            const canLink = isActive && unlinkedCount > 0;
            const showLinkedTable = group.documents.length > 0 || canLink;
            return (
              <div key={group.contract.id} className="flex flex-col gap-3">
                <p className="text-foreground px-1 text-sm font-medium">
                  {group.contract.legalEntity || t('title')}
                </p>
                {showLinkedTable ? (
                  <LinkedPolicyTable
                    contractId={group.contract.id}
                    documents={group.documents}
                    tableLabel={`${t('linkedTitle')} ${group.contract.legalEntity || t('title')}`}
                    canRemove={isActive}
                    canLink={canLink}
                    onLink={() => {
                      setLinkContractId(group.contract.id);
                      linkDialog.open();
                    }}
                  />
                ) : (
                  <p className="text-muted text-sm">{t('linkedEmpty')}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {activeGroup ? (
        <EuRepLinkPoliciesDialog
          state={linkDialog}
          contractId={activeGroup.contract.id}
          linkedDocumentIds={activeGroup.contract.linkedDocumentIds}
        />
      ) : null}
    </AccountSection>
  );
}

function ContractsCountSection({ count, onAdd }: { count: number; onAdd: () => void }) {
  const t = useTranslations('account.euRep.contract');

  return (
    <AccountSection
      title={t('countTitle')}
      className="min-w-0 flex-1 gap-4"
      contentClassName="gap-3"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <PriceBlock amount={String(count)} animatedAmount={count} className="min-w-0" />
        <Button variant="outline" size="sm" className="shrink-0 gap-2" onPress={onAdd}>
          <ShoppingCart size={14} weight="bold" aria-hidden />
          {t('add')}
        </Button>
      </div>
    </AccountSection>
  );
}

function RequestsSection({
  subscription,
  onPaymentRequest,
  isPending,
}: {
  subscription?: Subscription;
  onPaymentRequest: () => void;
  isPending: boolean;
}) {
  const t = useTranslations('account.euRep.contract');
  const included =
    subscription?.includedRequests ?? resolveEuRepPlan(subscription?.planId).includedRequests;
  const used = subscription?.usedRequests ?? 0;

  return (
    <AccountSection
      title={t('requestsTitle')}
      className="min-w-0 flex-1 gap-4"
      contentClassName="gap-3"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <PriceBlock amount={`${used}/${included}`} className="min-w-0" />
          <p className="text-muted text-xs">
            {t('requestsHint', { price: EU_REP_EXTRA_REQUEST_PRICE })}
          </p>
        </div>
        {subscription ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            isDisabled={isPending}
            onPress={onPaymentRequest}
          >
            {t('paymentRequestCta')}
          </Button>
        ) : null}
      </div>
    </AccountSection>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onSort,
  align = 'left',
}: {
  label: string;
  active: boolean;
  direction: SortDir;
  onSort: () => void;
  align?: 'left' | 'right';
}) {
  return (
    <button
      type="button"
      onClick={onSort}
      className={`text-muted hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-sm font-medium ${
        align === 'right' ? 'ml-auto' : ''
      }`}
    >
      {label}
      {active ? (
        direction === 'asc' ? (
          <CaretUp size={12} weight="bold" aria-hidden />
        ) : (
          <CaretDown size={12} weight="bold" aria-hidden />
        )
      ) : (
        <CaretDown size={12} weight="bold" aria-hidden className="opacity-30" />
      )}
    </button>
  );
}

export function EuRepContractPanel({ scope = 'site' }: { scope?: 'site' | 'all' }) {
  const t = useTranslations('account.euRep.contract');
  const ts = useTranslations('account.status');
  const td = useTranslations('account.documents');
  const router = useRouter();
  const { activeSite } = useSiteScope();
  const { activeContract: scopedContract } = useEuRepScope();
  const contracts = useEuRepContracts();
  const documents = useDocuments();
  const subscriptions = useSubscriptions();
  const createExtraRequest = useCreateEuRepExtraRequest();

  const siteContract = useMemo(
    () => (activeSite ? resolveSiteEuRepContract(activeSite, contracts.data ?? []) : undefined),
    [activeSite, contracts.data]
  );

  const [sortKey, setSortKey] = useState<SortKey>('legalEntity');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const groups = useMemo(() => {
    const all = groupEuRepContractsBySubscription(
      contracts.data ?? [],
      subscriptions.data ?? [],
      documents.data ?? []
    );
    if (scope === 'all') return all;
    if (!siteContract) return [];
    return all.filter((group) => group.contract.id === siteContract.id);
  }, [contracts.data, subscriptions.data, documents.data, siteContract, scope]);

  const sortedGroups = useMemo(() => {
    const next = groups.slice();
    next.sort((a, b) => {
      if (sortKey === 'legalEntity') {
        const left = (a.contract.legalEntity || '').localeCompare(
          b.contract.legalEntity || '',
          undefined,
          {
            sensitivity: 'base',
          }
        );
        return sortDir === 'asc' ? left : -left;
      }
      const periodA =
        a.subscription?.startDate && a.subscription.nextPaymentDate
          ? subscriptionDaysLeft(a.subscription.startDate, a.subscription.nextPaymentDate)
              .remainingDays
          : -1;
      const periodB =
        b.subscription?.startDate && b.subscription.nextPaymentDate
          ? subscriptionDaysLeft(b.subscription.startDate, b.subscription.nextPaymentDate)
              .remainingDays
          : -1;
      const diff = periodA - periodB;
      return sortDir === 'asc' ? diff : -diff;
    });
    return next;
  }, [groups, sortKey, sortDir]);

  const primaryEuSubscription = useMemo(() => {
    if (scope === 'site' && siteContract) {
      return (subscriptions.data ?? []).find((row) => row.id === siteContract.subscriptionId);
    }
    if (scopedContract?.subscriptionId) {
      const matched = (subscriptions.data ?? []).find(
        (row) => row.id === scopedContract.subscriptionId
      );
      if (matched) return matched;
    }
    const euSubs = (subscriptions.data ?? []).filter((row) => row.productType === 'euRep');
    return euSubs.find((row) => row.status === 'active') ?? euSubs[0];
  }, [subscriptions.data, siteContract, scopedContract, scope]);

  const selectedContractId = scope === 'all' ? scopedContract?.id : siteContract?.id;

  const unlinkedCount = (documents.data ?? []).filter((doc) => {
    if (doc.euRepContractId) return false;
    if (scope === 'site' && activeSite) return doc.site === activeSite.domain;
    return true;
  }).length;

  const goToCheckout = () => {
    router.push('/account/eu-rep/checkout');
  };

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  }

  async function handlePaymentRequest() {
    if (!primaryEuSubscription) return;
    try {
      await createExtraRequest.mutateAsync({ subscriptionId: primaryEuSubscription.id });
      toast.success(t('paymentRequestSuccess', { price: EU_REP_EXTRA_REQUEST_PRICE }));
    } catch {
      toast.error(t('paymentRequestFailed'));
    }
  }

  return (
    <DataState
      isLoading={contracts.isLoading || documents.isLoading || subscriptions.isLoading}
      isError={contracts.isError}
      onRetry={() => {
        void contracts.refetch();
        void documents.refetch();
        void subscriptions.refetch();
      }}
    >
      <div className="divide-border flex flex-col divide-y">
        <div className="border-border divide-border flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
          <ContractsCountSection count={groups.length} onAdd={goToCheckout} />
          <RequestsSection
            subscription={primaryEuSubscription}
            isPending={createExtraRequest.isPending}
            onPaymentRequest={() => {
              void handlePaymentRequest();
            }}
          />
        </div>

        <AccountSection contentClassName="gap-6">
          {sortedGroups.length === 0 ? (
            <EmptyState
              message={t('listEmpty')}
              action={
                <Button variant="primary" size="md" className="gap-2" onPress={goToCheckout}>
                  <Plus size={18} weight="bold" aria-hidden />
                  {t('add')}
                </Button>
              }
            />
          ) : (
            <AccountTable aria-label={t('listTitle')}>
              <Table.Header>
                <Table.Column isRowHeader>
                  <SortableHeader
                    label={t('colLegalEntity')}
                    active={sortKey === 'legalEntity'}
                    direction={sortDir}
                    onSort={() => {
                      toggleSort('legalEntity');
                    }}
                  />
                </Table.Column>
                <Table.Column>{t('colPlan')}</Table.Column>
                <Table.Column className="text-right">
                  <SortableHeader
                    label={t('colDays')}
                    active={sortKey === 'remainingDays'}
                    direction={sortDir}
                    onSort={() => {
                      toggleSort('remainingDays');
                    }}
                    align="right"
                  />
                </Table.Column>
                <Table.Column className="text-right">
                  <span className="sr-only">{t('colActions')}</span>
                </Table.Column>
              </Table.Header>
              <Table.Body>
                {sortedGroups.map((group) => {
                  const groupSubscription = group.subscription;
                  const period =
                    groupSubscription?.startDate && groupSubscription.nextPaymentDate
                      ? subscriptionDaysLeft(
                          groupSubscription.startDate,
                          groupSubscription.nextPaymentDate
                        )
                      : null;
                  const daysLeftLabel = period
                    ? td('daysLeft', { count: period.remainingDays })
                    : null;
                  const planId = groupSubscription?.planId ?? 'basis';
                  const planLabel = t(`plans.${planId}` as 'plans.basis');
                  const isSelected = group.contract.id === selectedContractId;

                  return (
                    <Table.Row
                      key={group.contract.id}
                      aria-current={isSelected ? 'true' : undefined}
                      className={cn(
                        '[&_.table__cell]:!bg-surface',
                        isSelected && '[&_.table__cell]:!bg-key-50'
                      )}
                    >
                      <Table.Cell>
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="text-foreground font-medium">
                            {group.contract.legalEntity || t('title')}
                          </span>
                          <StatusPill
                            tone={statusTone(group.subscription?.status ?? group.contract.status)}
                          >
                            {ts(group.subscription?.status ?? group.contract.status)}
                          </StatusPill>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-muted text-sm">{planLabel}</span>
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        {period && daysLeftLabel ? (
                          <div className="inline-flex items-center justify-end gap-2">
                            <span className="text-muted text-sm">{daysLeftLabel}</span>
                            <DaysLeftDonut
                              remaining={period.remainingDays}
                              total={period.totalDays}
                              label={daysLeftLabel}
                            />
                          </div>
                        ) : (
                          <span className="text-muted text-sm">—</span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => {
                              router.push(euRepContractDetailHref(group.contract.id));
                            }}
                          >
                            {t('edit')}
                          </Button>
                          {groupSubscription ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onPress={() => {
                                router.push(subscriptionDetailHref(groupSubscription.id));
                              }}
                            >
                              {t('manageSubscription')}
                            </Button>
                          ) : null}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </AccountTable>
          )}
        </AccountSection>

        <LinkedPoliciesSecondary groups={groups} unlinkedCount={unlinkedCount} />
      </div>
    </DataState>
  );
}
