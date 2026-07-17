'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useOrders } from '@/api/billing';
import { useAddresses } from '@/api/account';
import { MapPin, Question, Table } from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import {
  AccountSection,
  AccountTable,
  DataState,
  EmptyState,
  InvoiceDownloadButton,
  formatMoney,
  useDateFormatter,
} from '../account-ui';

export function GeneratorPaymentsPanel({ onManagePayment }: { onManagePayment?: () => void }) {
  const t = useTranslations('account.generatorPlan');
  const tFooter = useTranslations('footer');
  const orders = useOrders();
  const addresses = useAddresses();
  const formatDate = useDateFormatter();

  const billing = addresses.data?.find((address) => address.type === 'billing');

  const policyOrders =
    orders.data
      ?.filter((order) => order.productType === 'policy')
      .sort((a, b) => b.date.localeCompare(a.date)) ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataState
        isLoading={orders.isLoading}
        isError={orders.isError}
        onRetry={() => void orders.refetch()}
      >
        {orders.data && policyOrders.length === 0 ? (
          <EmptyState message={t('paymentsEmpty')} />
        ) : null}

        {policyOrders.length > 0 ? (
          <div className="divide-border flex min-h-0 flex-1 flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
            <div className="divide-border flex min-h-0 min-w-0 flex-1 flex-col">
              <AccountSection
                title={t('billingHistory')}
                className="min-h-0 flex-1"
                contentClassName="gap-0"
              >
                <AccountTable aria-label={t('billingHistory')}>
                  <Table.Header>
                    <Table.Column isRowHeader>{t('colInvoice')}</Table.Column>
                    <Table.Column>{t('colDate')}</Table.Column>
                    <Table.Column>{t('colSites')}</Table.Column>
                    <Table.Column className="text-right">{t('colAmount')}</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {policyOrders.map((order) => (
                      <Table.Row key={order.id}>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{order.number}</span>
                            <InvoiceDownloadButton
                              label={t('downloadInvoice')}
                              onPress={() => {
                                toast.success(t('invoiceDownloadStarted'));
                              }}
                            />
                          </div>
                        </Table.Cell>
                        <Table.Cell>{formatDate(order.date)}</Table.Cell>
                        <Table.Cell>{order.siteCount ?? '—'}</Table.Cell>
                        <Table.Cell className="text-right">
                          <span className="text-foreground font-normal">
                            {formatMoney(order.total, order.currency)}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </AccountTable>
              </AccountSection>
            </div>

            <div className="divide-border flex w-full shrink-0 flex-col divide-y lg:w-[280px]">
              {billing ? (
                <AccountSection
                  size="small"
                  title={t('billingDetailsEyebrow')}
                  icon={<MapPin size={14} weight="fill" className="shrink-0" aria-hidden />}
                  action={
                    onManagePayment ? (
                      <NavigationLink
                        onPress={onManagePayment}
                        size="sm"
                        chevron="none"
                        className="shrink-0"
                      >
                        {t('change')}
                      </NavigationLink>
                    ) : undefined
                  }
                >
                  <address className="text-foreground text-sm leading-relaxed not-italic">
                    {billing.firstName} {billing.lastName}
                    <br />
                    {billing.company ? (
                      <>
                        {billing.company}
                        <br />
                      </>
                    ) : null}
                    {billing.line1}
                    <br />
                    {billing.postalCode} {billing.city}
                    <br />
                    {billing.country}
                  </address>
                </AccountSection>
              ) : null}

              <AccountSection
                size="small"
                title={t('questionsTitle')}
                icon={<Question size={14} weight="fill" className="shrink-0" aria-hidden />}
              >
                <p className="text-foreground text-sm leading-relaxed">{t('questionsBody')}</p>
                <NavigationLink href="/contact?subject=generator" size="sm">
                  {t('contactUs')}
                </NavigationLink>
              </AccountSection>

              <AccountSection size="small" className="gap-1.5" contentClassName="gap-1.5">
                <NavigationLink href="/terms" size="sm">
                  {tFooter('termsOfService')}
                </NavigationLink>
                <NavigationLink href="/privacy" size="sm">
                  {tFooter('privacyPolicy')}
                </NavigationLink>
              </AccountSection>
            </div>
          </div>
        ) : null}
      </DataState>
    </div>
  );
}
