'use client';

import { useTranslations } from 'next-intl';
import type { AffiliateDashboard } from '@/api/affiliate';
import { Table } from '@/components/ui';
import { AccountTable, useDateFormatter } from './account-ui';

type AffiliateConversionsTableProps = {
  conversions: AffiliateDashboard['recentConversions'];
  ariaLabel: string;
};

function formatChf(amount: number) {
  return `CHF ${amount.toFixed(2)}`;
}

export function AffiliateConversionsTable({
  conversions,
  ariaLabel,
}: AffiliateConversionsTableProps) {
  const t = useTranslations('account.affiliate.dashboard.conversionsTable');
  const formatDate = useDateFormatter();

  return (
    <AccountTable aria-label={ariaLabel}>
      <Table.Header>
        <Table.Column isRowHeader>{t('colOrder')}</Table.Column>
        <Table.Column className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
          {t('colDate')}
        </Table.Column>
        <Table.Column className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
          {t('colAmount')}
        </Table.Column>
        <Table.Column className="w-36 max-w-36 shrink-0 text-right whitespace-nowrap">
          {t('colCommission')}
        </Table.Column>
      </Table.Header>
      <Table.Body>
        {conversions.map((row) => (
          <Table.Row key={row.id}>
            <Table.Cell>
              <span className="font-mono text-sm font-semibold">{row.orderNumber}</span>
            </Table.Cell>
            <Table.Cell className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap tabular-nums">
              {formatDate(row.createdAt)}
            </Table.Cell>
            <Table.Cell className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap tabular-nums">
              {formatChf(row.amountChf)}
            </Table.Cell>
            <Table.Cell className="w-36 max-w-36 shrink-0 text-right whitespace-nowrap tabular-nums">
              {formatChf(row.commissionChf)}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </AccountTable>
  );
}
