'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useDocuments,
  useGeneratorPlan,
  type DocumentStatus,
  type GeneratedDocument,
} from '@/api/documents';
import {
  ArrowsClockwise,
  CheckCircle,
  FileText,
  GridFour,
  Plus,
  Button,
  SearchField,
  Table,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import {
  AccountFilterDropdown,
  AccountSection,
  AccountTable,
  DataState,
  EmptyState,
  useDateFormatter,
} from '../account-ui';

type StatusFilter = 'all' | DocumentStatus;

function CountWithAdd({
  addLabel,
  onAdd,
  children,
}: {
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        variant="outline"
        size="sm"
        isIconOnly
        aria-label={addLabel}
        className="size-9 shrink-0 rounded-full"
        onPress={onAdd}
      >
        <Plus size={14} weight="bold" aria-hidden />
      </Button>
    </div>
  );
}

function matchesDocumentSearch(name: string, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return name.toLowerCase().includes(normalized);
}

function DocumentTable({
  documents,
  searchQuery,
  statusFilter,
  emptySearch,
  emptyFiltered,
  tableLabel,
  onRetrieve,
  onUpdate,
}: {
  documents: GeneratedDocument[];
  searchQuery: string;
  statusFilter: StatusFilter;
  emptySearch: string;
  emptyFiltered: string;
  tableLabel: string;
  onRetrieve: () => void;
  onUpdate: () => void;
}) {
  const t = useTranslations('account.documents');
  const ts = useTranslations('account.status');
  const formatDate = useDateFormatter();

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      return matchesDocumentSearch(doc.name, searchQuery);
    });
  }, [documents, searchQuery, statusFilter]);

  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasStatusFilter = statusFilter !== 'all';

  if (filtered.length === 0) {
    return (
      <EmptyState
        message={hasSearchQuery ? emptySearch : hasStatusFilter ? emptyFiltered : emptySearch}
      />
    );
  }

  return (
    <AccountTable aria-label={tableLabel}>
      <Table.Header>
        <Table.Column isRowHeader>{t('colName')}</Table.Column>
        <Table.Column>{t('colCreated')}</Table.Column>
        <Table.Column>{t('colStatus')}</Table.Column>
        <Table.Column className="text-right">{t('colActions')}</Table.Column>
      </Table.Header>
      <Table.Body>
        {filtered.map((doc) => (
          <Table.Row key={doc.id}>
            <Table.Cell>
              <span className="text-foreground flex items-center gap-2 font-medium">
                <FileText size={18} className="text-accent shrink-0" />
                {doc.name}
              </span>
            </Table.Cell>
            <Table.Cell>{formatDate(doc.createdDate)}</Table.Cell>
            <Table.Cell>
              <StatusPill tone={statusTone(doc.status)}>{ts(doc.status)}</StatusPill>
            </Table.Cell>
            <Table.Cell className="text-right">
              <div className="flex items-center justify-end gap-3">
                {doc.status === 'updateAvailable' ? (
                  <NavigationLink onPress={onUpdate} size="sm" chevron="none">
                    {t('update')}
                  </NavigationLink>
                ) : null}
                <NavigationLink onPress={onRetrieve} size="sm" chevron="none">
                  {t('retrieve')}
                </NavigationLink>
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </AccountTable>
  );
}

function AllowanceSection({
  used,
  total,
  onAdd,
  addLabel,
}: {
  used: number;
  total: number;
  onAdd: () => void;
  addLabel: string;
}) {
  const t = useTranslations('account.generatorPlan');
  const remaining = Math.max(0, total - used);
  const usedFraction = total > 0 ? Math.min(1, used / total) : 1;
  const isDepleted = remaining <= 0;

  return (
    <AccountSection title={t('title')} className="min-w-0 flex-1 gap-4" contentClassName="gap-3">
      <CountWithAdd addLabel={addLabel} onAdd={onAdd}>
        <PriceBlock amount={String(remaining)} animatedAmount={remaining} className="min-w-0" />
      </CountWithAdd>
      <div
        className="bg-border h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={used}
      >
        <div
          className={isDepleted ? 'bg-danger h-full rounded-full' : 'bg-accent h-full rounded-full'}
          style={{ width: `${usedFraction * 100}%` }}
        />
      </div>
    </AccountSection>
  );
}

function GeneratedCountSection({
  documents,
  onAdd,
  addLabel,
}: {
  documents: GeneratedDocument[];
  onAdd: () => void;
  addLabel: string;
}) {
  const t = useTranslations('account.documents');
  const upToDate = documents.filter((doc) => doc.status === 'upToDate').length;
  const updateAvailable = documents.filter((doc) => doc.status === 'updateAvailable').length;

  return (
    <AccountSection
      title={t('countTitle')}
      className="min-w-0 flex-1 gap-4"
      contentClassName="gap-3"
    >
      <CountWithAdd addLabel={addLabel} onAdd={onAdd}>
        <PriceBlock
          amount={String(documents.length)}
          animatedAmount={documents.length}
          className="min-w-0"
        />
      </CountWithAdd>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="text-foreground inline-flex items-center gap-1.5">
          <CheckCircle size={14} weight="fill" className="text-success shrink-0" aria-hidden />
          {t('countUpToDate', { count: upToDate })}
        </span>
        {updateAvailable > 0 ? (
          <>
            <span className="text-muted" aria-hidden>
              ·
            </span>
            <span className="text-foreground inline-flex items-center gap-1.5">
              <ArrowsClockwise
                size={14}
                weight="bold"
                className="text-warning shrink-0"
                aria-hidden
              />
              {t('countUpdateAvailable', { count: updateAvailable })}
            </span>
          </>
        ) : null}
      </div>
    </AccountSection>
  );
}

function PolicyStatsRow({
  documents,
  siteAllowance,
  onAdd,
  sitesAddLabel,
  policiesAddLabel,
}: {
  documents: GeneratedDocument[];
  siteAllowance?: number;
  onAdd: () => void;
  sitesAddLabel: string;
  policiesAddLabel: string;
}) {
  return (
    <div className="border-border divide-border flex flex-col divide-y border-b sm:flex-row sm:divide-x sm:divide-y-0">
      {siteAllowance != null ? (
        <AllowanceSection
          used={documents.length}
          total={siteAllowance}
          onAdd={onAdd}
          addLabel={sitesAddLabel}
        />
      ) : null}
      <GeneratedCountSection documents={documents} onAdd={onAdd} addLabel={policiesAddLabel} />
    </div>
  );
}

export function DocumentsSection() {
  const t = useTranslations('account.documents');
  const tGenerator = useTranslations('account.generatorPlan');
  const router = useRouter();
  const documents = useDocuments();
  const plan = useGeneratorPlan();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const goToGenerator = () => {
    router.push('/scan');
  };

  const statusFilterItems: ReadonlyArray<{ id: StatusFilter; label: string; icon: ReactNode }> = [
    {
      id: 'all',
      label: t('statusAll'),
      icon: <GridFour size={18} weight="fill" aria-hidden />,
    },
    {
      id: 'upToDate',
      label: t('statusUpToDate'),
      icon: <CheckCircle size={18} weight="fill" aria-hidden />,
    },
    {
      id: 'updateAvailable',
      label: t('statusUpdateAvailable'),
      icon: <ArrowsClockwise size={18} weight="fill" aria-hidden />,
    },
  ];

  return (
    <DataState
      isLoading={documents.isLoading || plan.isLoading}
      isError={documents.isError}
      onRetry={() => void documents.refetch()}
    >
      {documents.data ? (
        <div className="divide-border flex flex-col divide-y">
          <PolicyStatsRow
            documents={documents.data}
            siteAllowance={plan.data?.siteAllowance}
            onAdd={goToGenerator}
            sitesAddLabel={tGenerator('buyMore')}
            policiesAddLabel={t('create')}
          />

          <AccountSection title={t('listTitle')} contentClassName="gap-8">
            {documents.data.length === 0 ? (
              <EmptyState
                message={t('empty')}
                action={
                  <Button variant="primary" size="md" className="gap-2" onPress={goToGenerator}>
                    <Plus size={18} weight="bold" />
                    {t('emptyCta')}
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
                  <AccountFilterDropdown
                    ariaLabel={t('statusFilterLabel')}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    items={statusFilterItems}
                  />
                  <div className="ml-auto flex shrink-0 items-center gap-4">
                    <div className="w-64 min-w-48 shrink-0">
                      <SearchField
                        aria-label={t('searchLabel')}
                        name="document-search"
                        variant="secondary"
                        fullWidth
                        value={searchQuery}
                        onChange={setSearchQuery}
                      >
                        <SearchField.Group>
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder={t('searchPlaceholder')} />
                          <SearchField.ClearButton />
                        </SearchField.Group>
                      </SearchField>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onPress={goToGenerator}>
                      <Plus size={14} weight="bold" />
                      {t('create')}
                    </Button>
                  </div>
                </div>

                <DocumentTable
                  documents={documents.data}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  emptySearch={t('emptySearch')}
                  emptyFiltered={t('emptyFiltered')}
                  tableLabel={t('listTitle')}
                  onRetrieve={goToGenerator}
                  onUpdate={goToGenerator}
                />
              </>
            )}
          </AccountSection>
        </div>
      ) : null}
    </DataState>
  );
}
