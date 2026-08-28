'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSubscriptions, type Subscription } from '@/api/billing';
import { resolveDocumentSite, useDocuments, type GeneratedDocument } from '@/api/documents';
import {
  groupEuRepContractsBySubscription,
  useEuRepContracts,
  useUnlinkEuRepDocument,
  type EuRepContract,
} from '@/api/eu-rep';
import { euRepContractDetailHref } from '@/app/account/_components/account-sections';
import {
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
import {
  AccountSection,
  AccountTable,
  ConfirmDialog,
  DataState,
  DaysLeftDonut,
  EmptyState,
  PolicyDetailTableRow,
  PolicyTableRowCaret,
  TableRowAction,
  subscriptionDaysLeft,
  useDateFormatter,
} from '../account-ui';

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
                    <PolicyTableRowCaret label={t('open')} />
                  </div>
                </Table.Cell>
              </PolicyDetailTableRow>
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

function ContractGroup({
  contract,
  documents,
  subscription,
  unlinkedCount,
}: {
  contract: EuRepContract;
  documents: GeneratedDocument[];
  subscription?: Subscription;
  unlinkedCount: number;
}) {
  const t = useTranslations('account.euRep.contract');
  const td = useTranslations('account.documents');
  const ts = useTranslations('account.status');
  const linkDialog = useOverlayState();
  const isActive = contract.status === 'active';

  const period =
    subscription?.startDate && subscription.nextPaymentDate
      ? subscriptionDaysLeft(subscription.startDate, subscription.nextPaymentDate)
      : null;
  const daysLeftLabel = period ? td('daysLeft', { count: period.remainingDays }) : null;
  const canLink = isActive && unlinkedCount > 0;
  const showLinkedTable = documents.length > 0 || canLink;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center justify-between gap-3 px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <NavigationLink
              href={euRepContractDetailHref(contract.id)}
              size="sm"
              chevron="right"
              className="text-foreground font-semibold"
            >
              {contract.legalEntity || t('title')}
            </NavigationLink>
            <StatusPill tone={statusTone(subscription?.status ?? contract.status)}>
              {ts(subscription?.status ?? contract.status)}
            </StatusPill>
          </div>
          {subscription ? (
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-muted text-sm">
                {td('subscriptionSites', { count: documents.length })}
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

        {showLinkedTable ? (
          <LinkedPolicyTable
            contractId={contract.id}
            documents={documents}
            tableLabel={`${td('listTitle')} ${contract.legalEntity || t('title')}`}
            canRemove={isActive}
            canLink={canLink}
            onLink={() => {
              linkDialog.open();
            }}
          />
        ) : (
          <p className="text-muted text-sm">{t('linkedEmpty')}</p>
        )}
      </div>

      <EuRepLinkPoliciesDialog
        state={linkDialog}
        contractId={contract.id}
        linkedDocumentIds={contract.linkedDocumentIds}
      />
    </>
  );
}

function LinkedPoliciesCountSection({ count }: { count: number }) {
  const t = useTranslations('account.euRep.contract');

  return (
    <AccountSection
      title={t('linkedCountTitle')}
      className="min-w-0 flex-1 gap-4"
      contentClassName="gap-3"
    >
      <PriceBlock amount={String(count)} animatedAmount={count} className="min-w-0" />
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

export function EuRepContractPanel() {
  const t = useTranslations('account.euRep.contract');
  const router = useRouter();
  const contracts = useEuRepContracts();
  const documents = useDocuments();
  const subscriptions = useSubscriptions();

  const groups = useMemo(
    () =>
      groupEuRepContractsBySubscription(
        contracts.data ?? [],
        subscriptions.data ?? [],
        documents.data ?? []
      ),
    [contracts.data, subscriptions.data, documents.data]
  );

  const linkedPolicyCount = groups.reduce((sum, group) => sum + group.documents.length, 0);
  const contractCount = groups.length;
  const unlinkedCount = (documents.data ?? []).filter((doc) => !doc.euRepContractId).length;

  const goToCheckout = () => {
    router.push('/account/eu-rep/checkout');
  };

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
          <ContractsCountSection count={contractCount} onAdd={goToCheckout} />
          <LinkedPoliciesCountSection count={linkedPolicyCount} />
        </div>

        <AccountSection contentClassName="gap-8">
          {groups.length === 0 ? (
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
            <div className="flex flex-col gap-8">
              {groups.map((group) => (
                <ContractGroup
                  key={group.contract.id}
                  contract={group.contract}
                  documents={group.documents}
                  subscription={group.subscription}
                  unlinkedCount={unlinkedCount}
                />
              ))}
            </div>
          )}
        </AccountSection>
      </div>
    </DataState>
  );
}
