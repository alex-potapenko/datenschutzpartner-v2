'use client';

import { useTranslations } from 'next-intl';
import { useOrders, type BillingProductType, type Order } from '@/api/billing';
import { Table } from '@/components/ui';
import {
  AccountPanel,
  AccountTable,
  DataState,
  EmptyState,
  SectionHeader,
  formatMoney,
  useDateFormatter,
} from '../account-ui';

type OrdersSectionProps = {
  embedded?: boolean;
  productType?: BillingProductType;
};

function formatSiteCount(count: number, t: ReturnType<typeof useTranslations<'account.orders'>>) {
  return t('siteCount', { count });
}

function orderKindLabel(order: Order, t: ReturnType<typeof useTranslations<'account.orders'>>) {
  if (order.orderKind === 'extraInquiry') {
    return t('orderKindExtraInquiry');
  }

  if (order.orderKind === 'subscription') {
    return t('orderKindSubscription');
  }

  return null;
}

export function OrdersSection({ embedded = false, productType }: OrdersSectionProps = {}) {
  const t = useTranslations('account.orders');
  const orders = useOrders();
  const formatDate = useDateFormatter();

  const rows = orders.data?.filter((order) => !productType || order.productType === productType);
  const showSiteColumn = productType === 'policy' || rows?.some((order) => order.siteCount != null);
  const showReferenceColumn =
    productType === 'euRep' || rows?.some((order) => order.orderKind === 'extraInquiry');

  return (
    <div className="flex flex-col gap-6">
      {embedded ? null : <SectionHeader title={t('title')} />}

      <DataState
        isLoading={orders.isLoading}
        isError={orders.isError}
        onRetry={() => void orders.refetch()}
      >
        {rows && rows.length === 0 ? <EmptyState message={t('empty')} /> : null}

        {rows && rows.length > 0 ? (
          <AccountPanel>
            <AccountTable aria-label={t('title')}>
              <Table.Header>
                <Table.Column isRowHeader>{t('colNumber')}</Table.Column>
                <Table.Column>{t('colDate')}</Table.Column>
                {showReferenceColumn ? <Table.Column>{t('colReference')}</Table.Column> : null}
                {showSiteColumn ? <Table.Column>{t('colSites')}</Table.Column> : null}
                <Table.Column className="text-right">{t('colTotal')}</Table.Column>
              </Table.Header>
              <Table.Body>
                {rows.map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell className="font-mono font-semibold">{order.number}</Table.Cell>
                    <Table.Cell>{formatDate(order.date)}</Table.Cell>
                    {showReferenceColumn ? (
                      <Table.Cell>{orderKindLabel(order, t) ?? t('referenceEmpty')}</Table.Cell>
                    ) : null}
                    {showSiteColumn ? (
                      <Table.Cell>
                        {order.siteCount != null
                          ? formatSiteCount(order.siteCount, t)
                          : t('referenceEmpty')}
                      </Table.Cell>
                    ) : null}
                    <Table.Cell className="text-right font-normal">
                      {formatMoney(order.total, order.currency)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </AccountTable>
          </AccountPanel>
        ) : null}
      </DataState>
    </div>
  );
}
