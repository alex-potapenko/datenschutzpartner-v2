'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAffiliateAdminPayouts, useMarkAffiliatePayoutTransferred } from '@/api/affiliate';
import { AffiliatePayoutStatusPill } from '@/app/account/_components/AffiliatePayoutStatusPill';
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
  const tc = useTranslations('common');
  const payouts = useAffiliateAdminPayouts();
  const markTransferred = useMarkAffiliatePayoutTransferred();
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
              <Table.Column>{t('colReferrals')}</Table.Column>
              <Table.Column className="text-right whitespace-nowrap">{t('colAmount')}</Table.Column>
              <Table.Column className="whitespace-nowrap">{t('colStatus')}</Table.Column>
              <Table.Column className="text-right">
                <span className="sr-only">{t('colActions')}</span>
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell className="whitespace-nowrap">
                    <span className="block tabular-nums">{formatDate(row.createdAt)}</span>
                    <span className="text-muted block font-mono text-xs">{row.id}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-foreground block font-medium">{row.partnerEmail}</span>
                    <span className="text-muted block text-xs">
                      {t('createdBy', { email: row.createdBy })}
                    </span>
                    <span className="text-muted block text-xs">
                      {t('invoiceTo', { email: row.invoiceEmailSentTo })}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-sm">
                    <span className="block">
                      {periodLabel(row)} · {t('referralCount', { count: row.referralCount })}
                    </span>
                    <span className="text-muted block max-w-56 font-mono text-xs break-words">
                      {row.referralReferences.join(', ')}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(row.amountChf, 'CHF')}
                  </Table.Cell>
                  <Table.Cell>
                    <AffiliatePayoutStatusPill status={row.status} />
                    {row.transferredAt ? (
                      <span className="text-muted mt-1 block text-xs whitespace-nowrap">
                        {formatDate(row.transferredAt)}
                      </span>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {row.status === 'invoice_requested' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        isDisabled={markTransferred.isPending}
                        onPress={() => {
                          markTransferred.mutate(row.id, {
                            onSuccess: () => toast.success(t('transferred')),
                            onError: () => toast.error(tc('error')),
                          });
                        }}
                      >
                        {t('markTransferred')}
                      </Button>
                    ) : null}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </AccountTable>
        )}
      </DataState>
    </AccountSection>
  );
}
