'use client';

import { useTranslations } from 'next-intl';
import type { AffiliateDashboard, AffiliatePayout } from '@/api/affiliate';
import { Table } from '@/components/ui';
import { AffiliatePayoutStatusPill } from '../../AffiliatePayoutStatusPill';
import { AccountSection, AccountTable, useDateFormatter } from '../../account-ui';
import { AffiliatePayoutInfoBody } from './AffiliatePayoutInfo';

export function usePayoutPeriodLabel() {
  const t = useTranslations('account.affiliate.payouts');
  const formatDate = useDateFormatter();
  return (payout: Pick<AffiliatePayout, 'periodStart' | 'periodEnd'>) => {
    if (payout.periodStart && payout.periodEnd) {
      return t('periodRange', {
        start: formatDate(payout.periodStart),
        end: formatDate(payout.periodEnd),
      });
    }
    if (payout.periodEnd) return t('periodUntil', { end: formatDate(payout.periodEnd) });
    if (payout.periodStart) return t('periodFrom', { start: formatDate(payout.periodStart) });
    return t('periodAll');
  };
}

export function AffiliatePayoutsPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.payouts');
  const formatDate = useDateFormatter();
  const periodLabel = usePayoutPeriodLabel();
  const title = t('historyTitle');
  const invoicePending = dashboard.payouts.filter((row) => row.status === 'invoice_requested');

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0">
      <AccountSection title={t('instructionsTitle')} contentClassName="gap-4">
        <p className="text-muted text-sm leading-relaxed">{t('instructionsIntro')}</p>
        <AffiliatePayoutInfoBody dashboard={dashboard} />
        {invoicePending.length > 0 ? (
          <ul className="text-foreground list-none space-y-2 text-sm leading-relaxed">
            {invoicePending.map((row) => (
              <li key={row.id} className="border-border rounded-lg border px-4 py-3">
                {t('instructionsAmount', {
                  amount: row.amountChf.toFixed(2),
                  date: formatDate(row.createdAt),
                })}
              </li>
            ))}
          </ul>
        ) : null}
      </AccountSection>

      <AccountSection contentClassName="gap-6">
        {dashboard.payouts.length > 0 ? (
          <AccountTable aria-label={title}>
            <Table.Header>
              <Table.Column isRowHeader className="whitespace-nowrap">
                {t('colDate')}
              </Table.Column>
              <Table.Column>{t('colPeriod')}</Table.Column>
              <Table.Column className="w-28 text-right whitespace-nowrap">
                {t('colReferrals')}
              </Table.Column>
              <Table.Column className="whitespace-nowrap">{t('colStatus')}</Table.Column>
              <Table.Column className="w-36 text-right whitespace-nowrap">
                {t('colAmount')}
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {dashboard.payouts.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell className="whitespace-nowrap tabular-nums">
                    {formatDate(row.createdAt)}
                  </Table.Cell>
                  <Table.Cell className="text-sm">{periodLabel(row)}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{row.referralCount}</Table.Cell>
                  <Table.Cell>
                    <AffiliatePayoutStatusPill status={row.status} />
                  </Table.Cell>
                  <Table.Cell className="text-right whitespace-nowrap tabular-nums">
                    CHF {row.amountChf.toFixed(2)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </AccountTable>
        ) : (
          <p className="text-muted text-sm leading-relaxed">{t('empty')}</p>
        )}
      </AccountSection>
    </div>
  );
}
