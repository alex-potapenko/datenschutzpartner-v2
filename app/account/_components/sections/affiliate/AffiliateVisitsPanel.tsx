'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAffiliateVisits } from '@/api/affiliate';
import { PagePagination } from '@/components/shared/PagePagination';
import { StatusPill } from '@/components/shared/StatusPill';
import { Table } from '@/components/ui';
import { AccountSection, AccountTable, DataState, useDateFormatter } from '../../account-ui';

const VISITS_PAGE_SIZE = 20;

function referrerHost(referrer: string) {
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return referrer;
  }
}

export function AffiliateVisitsPanel() {
  const t = useTranslations('account.affiliate.visits');
  const formatDate = useDateFormatter();
  const visits = useAffiliateVisits();
  const [page, setPage] = useState(1);
  const rows = visits.data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / VISITS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * VISITS_PAGE_SIZE, currentPage * VISITS_PAGE_SIZE);
  const title = t('title');

  return (
    <AccountSection contentClassName="gap-4">
      <DataState
        isLoading={visits.isLoading}
        isError={visits.isError}
        onRetry={() => void visits.refetch()}
      >
        {rows.length === 0 ? (
          <p className="text-muted text-sm">{t('empty')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            <AccountTable aria-label={title}>
              <Table.Header>
                <Table.Column isRowHeader className="whitespace-nowrap">
                  {t('colDate')}
                </Table.Column>
                <Table.Column>{t('colTarget')}</Table.Column>
                <Table.Column>{t('colReferrer')}</Table.Column>
                <Table.Column className="whitespace-nowrap">{t('colConverted')}</Table.Column>
              </Table.Header>
              <Table.Body>
                {pageRows.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell className="whitespace-nowrap tabular-nums">
                      {formatDate(row.createdAt)}
                    </Table.Cell>
                    <Table.Cell className="font-mono text-xs">{row.targetPath}</Table.Cell>
                    <Table.Cell className="text-sm">
                      {row.referrer ? (
                        <span title={row.referrer}>{referrerHost(row.referrer)}</span>
                      ) : (
                        <span className="text-muted">{t('direct')}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {row.converted ? (
                        <StatusPill tone="success">{t('converted')}</StatusPill>
                      ) : (
                        <span className="text-muted text-sm">{t('notConverted')}</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </AccountTable>
            <PagePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              size="sm"
              labels={{
                navigation: t('pagination'),
                previous: t('previous'),
                next: t('next'),
              }}
            />
          </div>
        )}
      </DataState>
    </AccountSection>
  );
}
