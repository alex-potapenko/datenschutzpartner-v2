'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useDocuments,
  useGeneratorPlan,
  resolveDocumentSite,
  type GeneratedDocument,
} from '@/api/documents';
import { buildPolicyUpdateUrl } from '@/app/result/wizard-state';
import { FileText, Plus, Button, SearchField, Table } from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PriceBlock } from '@/components/shared/PriceBlock';
import {
  AccountSection,
  AccountTable,
  DataState,
  EmptyState,
  useDateFormatter,
} from '../account-ui';

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

function matchesDocumentSearch(document: GeneratedDocument, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    document.name.toLowerCase().includes(normalized) ||
    resolveDocumentSite(document).toLowerCase().includes(normalized)
  );
}

function DocumentTable({
  documents,
  searchQuery,
  emptySearch,
  tableLabel,
}: {
  documents: GeneratedDocument[];
  searchQuery: string;
  emptySearch: string;
  tableLabel: string;
}) {
  const t = useTranslations('account.documents');
  const formatDate = useDateFormatter();

  const filtered = useMemo(() => {
    return documents.filter((doc) => matchesDocumentSearch(doc, searchQuery));
  }, [documents, searchQuery]);

  if (filtered.length === 0) {
    return <EmptyState message={emptySearch} />;
  }

  return (
    <AccountTable aria-label={tableLabel}>
      <Table.Header>
        <Table.Column isRowHeader>{t('colName')}</Table.Column>
        <Table.Column>{t('colSite')}</Table.Column>
        <Table.Column>{t('colCreated')}</Table.Column>
        <Table.Column>{t('colUpdated')}</Table.Column>
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
            <Table.Cell>
              <span className="text-muted">{resolveDocumentSite(doc)}</span>
            </Table.Cell>
            <Table.Cell>{formatDate(doc.createdDate)}</Table.Cell>
            <Table.Cell>{formatDate(doc.updatedDate)}</Table.Cell>
            <Table.Cell className="text-right">
              <div className="flex items-center justify-end gap-3">
                <NavigationLink
                  href={buildPolicyUpdateUrl(doc.id, resolveDocumentSite(doc))}
                  size="sm"
                >
                  {t('update')}
                </NavigationLink>
                <NavigationLink href={`/account/policies/${doc.id}`} size="sm" chevron="right">
                  {t('open')}
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
      <p className="text-muted text-sm">{t('countAutoUpdated')}</p>
    </AccountSection>
  );
}

function PolicyStatsRow({
  documents,
  siteAllowance,
  onAddSites,
  onAddPolicies,
  sitesAddLabel,
  policiesAddLabel,
}: {
  documents: GeneratedDocument[];
  siteAllowance?: number;
  onAddSites: () => void;
  onAddPolicies: () => void;
  sitesAddLabel: string;
  policiesAddLabel: string;
}) {
  return (
    <div className="border-border divide-border flex flex-col divide-y border-b sm:flex-row sm:divide-x sm:divide-y-0">
      {siteAllowance != null ? (
        <AllowanceSection
          used={documents.length}
          total={siteAllowance}
          onAdd={onAddSites}
          addLabel={sitesAddLabel}
        />
      ) : null}
      <GeneratedCountSection
        documents={documents}
        onAdd={onAddPolicies}
        addLabel={policiesAddLabel}
      />
    </div>
  );
}

export function DocumentsSection() {
  const t = useTranslations('account.documents');
  const tGenerator = useTranslations('account.generatorPlan');
  const router = useRouter();
  const documents = useDocuments();
  const plan = useGeneratorPlan();
  const [searchQuery, setSearchQuery] = useState('');

  const goToCheckout = () => {
    router.push('/account/generator/checkout');
  };

  const goToScan = () => {
    router.push('/scan');
  };

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
            onAddSites={goToCheckout}
            onAddPolicies={goToScan}
            sitesAddLabel={tGenerator('buyMore')}
            policiesAddLabel={t('create')}
          />

          <AccountSection title={t('listTitle')} contentClassName="gap-8">
            {documents.data.length === 0 ? (
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
              <>
                <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto shrink-0 gap-2"
                    onPress={goToScan}
                  >
                    <Plus size={14} weight="bold" />
                    {t('create')}
                  </Button>
                </div>

                <DocumentTable
                  documents={documents.data}
                  searchQuery={searchQuery}
                  emptySearch={t('emptySearch')}
                  tableLabel={t('listTitle')}
                />
              </>
            )}
          </AccountSection>
        </div>
      ) : null}
    </DataState>
  );
}
