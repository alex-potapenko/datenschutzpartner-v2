'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { Order } from '@/api/billing';
import { downloadOrderInvoice } from '@/api/checkout';
import { Button, FileText, Table } from '@/components/ui';
import { AccountTable, OrderAmount, useDateFormatter } from './account-ui';

export type BillingHistoryTableProps = {
  orders: Order[];
  ariaLabel: string;
  showServiceColumn?: boolean;
  getServiceLabel?: (order: Order) => string;
};

/** Shared billing-history table — policy, EU Rep, and overview recent payments. */
export function BillingHistoryTable({
  orders,
  ariaLabel,
  showServiceColumn = false,
  getServiceLabel,
}: BillingHistoryTableProps) {
  const t = useTranslations('account.billingHistory');
  const formatDate = useDateFormatter();

  async function handleDownload(orderId: string) {
    try {
      await downloadOrderInvoice(orderId);
      toast.success(t('downloadStarted'));
    } catch {
      toast.error('Download failed');
    }
  }

  return (
    <AccountTable aria-label={ariaLabel}>
      <Table.Header>
        <Table.Column isRowHeader>{t('colInvoice')}</Table.Column>
        {showServiceColumn ? <Table.Column>{t('colService')}</Table.Column> : null}
        <Table.Column className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
          {t('colDate')}
        </Table.Column>
        <Table.Column className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
          {t('colAmount')}
        </Table.Column>
        <Table.Column className="w-0 shrink-0 whitespace-nowrap">
          <span className="sr-only">{t('colActions')}</span>
        </Table.Column>
      </Table.Header>
      <Table.Body>
        {orders.map((order) => (
          <Table.Row key={order.id}>
            <Table.Cell>
              <span className="font-mono text-sm font-semibold">{order.number}</span>
            </Table.Cell>
            {showServiceColumn ? <Table.Cell>{getServiceLabel?.(order) ?? '—'}</Table.Cell> : null}
            <Table.Cell className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
              {formatDate(order.date)}
            </Table.Cell>
            <Table.Cell className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
              <OrderAmount
                total={order.total}
                currency={order.currency}
                discountRate={order.discountRate}
                discountAmount={order.discountAmount}
              />
            </Table.Cell>
            <Table.Cell className="w-0 shrink-0 whitespace-nowrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-label={t('downloadInvoice')}
                onPress={() => {
                  void handleDownload(order.id);
                }}
              >
                <FileText size={14} aria-hidden />
                {t('colInvoice')}
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </AccountTable>
  );
}
