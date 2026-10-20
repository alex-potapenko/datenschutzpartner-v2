'use client';

import { useTranslations } from 'next-intl';
import type { AffiliateReferral, AffiliateReferralStatus } from '@/api/affiliate';
import { StatusPill, type StatusTone } from '@/components/shared/StatusPill';
import { Table } from '@/components/ui';
import { AccountTable, useDateFormatter } from './account-ui';

type AffiliateReferralsTableProps = {
  referrals: AffiliateReferral[];
  ariaLabel: string;
};

export const AFFILIATE_REFERRAL_STATUS_TONE: Record<AffiliateReferralStatus, StatusTone> = {
  pending: 'neutral',
  unpaid: 'warning',
  paid: 'success',
  rejected: 'danger',
};

function formatChf(amount: number) {
  return `CHF ${amount.toFixed(2)}`;
}

export function AffiliateReferralsTable({ referrals, ariaLabel }: AffiliateReferralsTableProps) {
  const t = useTranslations('account.affiliate.dashboard');
  const formatDate = useDateFormatter();

  return (
    <AccountTable aria-label={ariaLabel}>
      <Table.Header>
        <Table.Column isRowHeader>{t('referralsTable.colReference')}</Table.Column>
        <Table.Column>{t('referralsTable.colProduct')}</Table.Column>
        <Table.Column className="whitespace-nowrap">{t('referralsTable.colStatus')}</Table.Column>
        <Table.Column className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
          {t('referralsTable.colDate')}
        </Table.Column>
        <Table.Column className="w-36 max-w-36 shrink-0 text-right whitespace-nowrap">
          {t('referralsTable.colCommission')}
        </Table.Column>
      </Table.Header>
      <Table.Body>
        {referrals.map((row) => (
          <Table.Row key={row.id}>
            <Table.Cell>
              <span className="font-mono text-sm font-semibold">{row.reference}</span>
            </Table.Cell>
            <Table.Cell className="text-sm">{row.description}</Table.Cell>
            <Table.Cell>
              <StatusPill tone={AFFILIATE_REFERRAL_STATUS_TONE[row.status]}>
                {t(`referralStatus.${row.status}`)}
              </StatusPill>
            </Table.Cell>
            <Table.Cell className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap tabular-nums">
              {formatDate(row.createdAt)}
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
