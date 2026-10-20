'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useAffiliateCampaignStats } from '@/api/affiliate';
import { Table } from '@/components/ui';
import { AccountTable, DataState, formatMoney } from '../../account-ui';

export function AffiliateCampaignStats() {
  const t = useTranslations('account.affiliate.campaigns');
  const format = useFormatter();
  const stats = useAffiliateCampaignStats();
  const rows = stats.data ?? [];

  return (
    <DataState
      isLoading={stats.isLoading}
      isError={stats.isError}
      onRetry={() => void stats.refetch()}
    >
      {rows.length === 0 ? (
        <p className="text-muted text-sm">{t('empty')}</p>
      ) : (
        <AccountTable aria-label={t('title')}>
          <Table.Header>
            <Table.Column isRowHeader>{t('colCampaign')}</Table.Column>
            <Table.Column className="text-right whitespace-nowrap">{t('colVisits')}</Table.Column>
            <Table.Column className="text-right whitespace-nowrap">
              {t('colReferrals')}
            </Table.Column>
            <Table.Column className="text-right whitespace-nowrap">
              {t('colConversion')}
            </Table.Column>
            <Table.Column className="text-right whitespace-nowrap">{t('colEarnings')}</Table.Column>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.campaign ?? '__none'}>
                <Table.Cell className="text-sm">
                  {row.campaign ?? <span className="text-muted">{t('noCampaign')}</span>}
                </Table.Cell>
                <Table.Cell className="text-right tabular-nums">{row.visits}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">{row.referrals}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">
                  {format.number(row.conversionRate, {
                    style: 'percent',
                    maximumFractionDigits: 1,
                  })}
                </Table.Cell>
                <Table.Cell className="text-right whitespace-nowrap tabular-nums">
                  {formatMoney(row.earningsChf, 'CHF')}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </AccountTable>
      )}
    </DataState>
  );
}
