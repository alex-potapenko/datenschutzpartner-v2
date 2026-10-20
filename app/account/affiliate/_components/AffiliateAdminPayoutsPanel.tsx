'use client';

import { useTranslations } from 'next-intl';
import { useAffiliateAdminPayouts } from '@/api/affiliate';
import { usePayoutPeriodLabel } from '@/app/account/_components/sections/affiliate/AffiliatePayoutsPanel';
import { Button, Table } from '@/components/ui';
import {
  AccountSection,
  AccountTable,
  DataState,
  formatMoney,
  useDateFormatter,
} from '@/app/account/_components/account-ui';

export function AffiliateAdminPayoutsPanel({ onCreatePayout }: { onCreatePayout: () => void }) {
  const t = useTranslations('account.affiliateAdmin.payouts');
  const formatDate = useDateFormatter();
  const periodLabel = usePayoutPeriodLabel();
  const payouts = useAffiliateAdminPayouts();
  const rows = payouts.data ?? [];

  return (
    <AccountSection
      title={t('title')}
      contentClassName="gap-4"
      action={
        <Button variant="primary" size="sm" onPress={onCreatePayout}>
          {t('create')}
        </Button>
      }
    >
      <p className="text-muted text-sm leading-relaxed">{t('body')}</p>
      <DataState
        isLoading={payouts.isLoading}
        isError={payouts.isError}
        onRetry={() => void payouts.refetch()}
      >
        {rows.length === 0 ? (
          <p className="text-muted text-sm">{t('empty')}</p>
        ) : (
          <AccountTable aria-label={t('title')}>
            <Table.Header>
              <Table.Column isRowHeader className="whitespace-nowrap">
                {t('colDate')}
              </Table.Column>
              <Table.Column>{t('colPartner')}</Table.Column>
              <Table.Column>{t('colPeriod')}</Table.Column>
              <Table.Column className="text-right whitespace-nowrap">
                {t('colReferrals')}
              </Table.Column>
              <Table.Column className="text-right whitespace-nowrap">{t('colAmount')}</Table.Column>
              <Table.Column>{t('colInvoiceEmail')}</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell className="whitespace-nowrap tabular-nums">
                    {formatDate(row.createdAt)}
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-foreground block font-medium">{row.partnerEmail}</span>
                    <span className="text-muted block text-xs">
                      {t('createdBy', { email: row.createdBy })}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-sm">{periodLabel(row)}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{row.referralCount}</Table.Cell>
                  <Table.Cell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(row.amountChf, 'CHF')}
                  </Table.Cell>
                  <Table.Cell className="text-sm">{row.invoiceEmailSentTo}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </AccountTable>
        )}
      </DataState>
    </AccountSection>
  );
}
