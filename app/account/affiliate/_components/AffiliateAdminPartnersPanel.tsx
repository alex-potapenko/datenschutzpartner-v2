'use client';

import { useTranslations } from 'next-intl';
import { useAffiliateAdminPartners } from '@/api/affiliate';
import { Button, Table } from '@/components/ui';
import {
  AccountSection,
  AccountTable,
  DataState,
  formatMoney,
  useDateFormatter,
} from '@/app/account/_components/account-ui';

export function AffiliateAdminPartnersPanel({
  onCreatePayout,
}: {
  onCreatePayout: (partnerId: string) => void;
}) {
  const t = useTranslations('account.affiliateAdmin.affiliates');
  const formatDate = useDateFormatter();
  const partners = useAffiliateAdminPartners();
  const rows = partners.data ?? [];

  return (
    <DataState
      isLoading={partners.isLoading}
      isError={partners.isError}
      onRetry={() => void partners.refetch()}
    >
      <AccountSection title={t('title')} contentClassName="gap-4">
        {rows.length === 0 ? (
          <p className="text-muted text-sm">{t('empty')}</p>
        ) : (
          <AccountTable aria-label={t('title')}>
            <Table.Header>
              <Table.Column isRowHeader>{t('colPartner')}</Table.Column>
              <Table.Column className="whitespace-nowrap">{t('colSince')}</Table.Column>
              <Table.Column className="text-right whitespace-nowrap">{t('colVisits')}</Table.Column>
              <Table.Column className="text-right whitespace-nowrap">
                {t('colReferrals')}
              </Table.Column>
              <Table.Column className="text-right whitespace-nowrap">{t('colUnpaid')}</Table.Column>
              <Table.Column className="text-right whitespace-nowrap">{t('colPaid')}</Table.Column>
              <Table.Column className="text-right">
                <span className="sr-only">{t('colActions')}</span>
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => {
                const referralCount =
                  row.referralCounts.pending + row.referralCounts.unpaid + row.referralCounts.paid;
                return (
                  <Table.Row key={row.id}>
                    <Table.Cell>
                      <span className="text-foreground block font-medium">{row.email}</span>
                      <span className="text-muted block font-mono text-xs">{row.slug}</span>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap tabular-nums">
                      {formatDate(row.approvedAt)}
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums">{row.visits}</Table.Cell>
                    <Table.Cell className="text-right tabular-nums">{referralCount}</Table.Cell>
                    <Table.Cell className="text-right whitespace-nowrap tabular-nums">
                      {formatMoney(row.unpaidEarningsChf, 'CHF')}
                    </Table.Cell>
                    <Table.Cell className="text-right whitespace-nowrap tabular-nums">
                      {formatMoney(row.paidEarningsChf, 'CHF')}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        isDisabled={row.unpaidEarningsChf <= 0}
                        onPress={() => {
                          onCreatePayout(row.id);
                        }}
                      >
                        {t('createPayout')}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </AccountTable>
        )}
      </AccountSection>
    </DataState>
  );
}
