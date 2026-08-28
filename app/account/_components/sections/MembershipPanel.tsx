'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useCancelSubscription,
  useOrders,
  useSubscriptions,
  type BillingProductType,
  type Subscription,
} from '@/api/billing';
import { downloadOrderInvoice } from '@/api/checkout';
import { useAddresses } from '@/api/account';
import {
  ArrowsClockwise,
  Button,
  CreditCard,
  FileText,
  MapPin,
  Question,
  Table,
  useOverlayState,
} from '@/components/ui';
import { BillingSelectionDialog } from '../BillingSelectionDialog';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { PriceBlock, priceBlockAmountClassName } from '@/components/shared/PriceBlock';
import {
  AccountSection,
  AccountTable,
  ConfirmDialog,
  DataState,
  EmptyState,
  InvoiceDownloadButton,
  formatMoney,
  useDateFormatter,
} from '../account-ui';

/** Anchor for AGB §5 Vertragslaufzeit — must match `LegalMarkdown` heading ids in `terms.de.md`. */
const TERMS_CONTRACT_DURATION_SECTION_ID = '5-vertragslaufzeit';

const CONTACT_SUBJECT: Record<BillingProductType, string> = {
  academy: 'academy',
  euRep: 'eu-rep',
  policy: 'generator',
};

async function handleInvoiceDownload(orderId: string, onStarted: () => void) {
  try {
    await downloadOrderInvoice(orderId);
    onStarted();
  } catch {
    toast.error('Download failed');
  }
}

function endOfTermDate(nextPaymentDate: string): string {
  const date = new Date(nextPaymentDate);
  date.setDate(date.getDate() - 1);
  return date.toISOString();
}

function CurrentPlanPanel({
  subscription,
  planTitle,
  pricePeriod,
  onCancel,
}: {
  subscription: Subscription;
  planTitle: string;
  pricePeriod: string;
  onCancel?: () => void;
}) {
  const t = useTranslations('account.membershipPanel');
  const ts = useTranslations('account.status');
  const formatDate = useDateFormatter();

  const { total, currency } = subscription.totals;
  const isCancelled = subscription.status === 'cancelled';

  return (
    <AccountSection
      title={planTitle}
      titleAside={
        <StatusPill tone={statusTone(subscription.status)}>{ts(subscription.status)}</StatusPill>
      }
      contentClassName="gap-6"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                color: 'var(--accent)',
                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              }}
              aria-hidden
            >
              <CreditCard size={18} weight="fill" />
            </span>
            <h3 className="text-foreground text-sm font-semibold">{t('sectionPayment')}</h3>
          </div>
          <div className="flex flex-col gap-2">
            <PriceBlock
              currency={currency}
              amount={total.toFixed(2)}
              animatedAmount={total}
              notes={[pricePeriod]}
              size="sm"
            />
            <p className="text-muted text-sm">
              {t('paidOn', {
                date: formatDate(subscription.lastOrderDate ?? subscription.startDate),
              })}
            </p>
          </div>
        </div>

        {!isCancelled && subscription.nextPaymentDate ? (
          <>
            <div
              className="bg-border h-px shrink-0 sm:h-auto sm:w-px sm:self-stretch"
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="text-success-soft-foreground flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'color-mix(in srgb, var(--success) 12%, transparent)' }}
                  aria-hidden
                >
                  <ArrowsClockwise size={16} weight="bold" />
                </span>
                <h3 className="text-foreground text-sm font-semibold">{t('sectionRenewal')}</h3>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <p className={priceBlockAmountClassName('sm')}>
                  {formatDate(subscription.nextPaymentDate)}
                </p>
                <p className="text-muted text-sm leading-relaxed">
                  {t('renewalReminder')}{' '}
                  <NavigationLink
                    href={`/terms#${TERMS_CONTRACT_DURATION_SECTION_ID}`}
                    size="sm"
                    className="inline-flex align-baseline"
                  >
                    {t('readMore')}
                  </NavigationLink>
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="md"
          className="gap-2"
          onPress={() => {
            const latestOrderId = subscription.relatedOrderIds.at(-1);
            if (latestOrderId) {
              void handleInvoiceDownload(latestOrderId, () => {
                toast.success(t('invoiceDownloadStarted'));
              });
            }
          }}
        >
          <FileText size={18} aria-hidden />
          {t('downloadInvoice')}
        </Button>
        {!isCancelled && subscription.nextPaymentDate && onCancel ? (
          <Button variant="outline" size="md" className="text-danger" onPress={onCancel}>
            {t('cancelCta')}
          </Button>
        ) : null}
      </div>
    </AccountSection>
  );
}

/**
 * Billing detail for a single product's yearly subscription — shared across the
 * Academy "Membership", EU Rep "Subscription" and Privacy Generator
 * "Subscription" tabs. All three are the same underlying billing record; only
 * the plan title, price period and the "what's included" block differ by
 * product.
 */
export function MembershipPanel({
  productType,
  onManagePayment,
}: {
  productType: BillingProductType;
  onManagePayment: () => void;
}) {
  const t = useTranslations('account.membershipPanel');
  const tFooter = useTranslations('footer');
  const tOrders = useTranslations('account.orders');
  const tGeneratorPlan = useTranslations('account.generatorPlan');
  const subscriptions = useSubscriptions();
  const orders = useOrders();
  const addresses = useAddresses();
  const cancel = useCancelSubscription();
  const confirm = useOverlayState();
  const billingSelection = useOverlayState();
  const formatDate = useDateFormatter();

  const subscription = subscriptions.data?.find((row) => row.productType === productType);
  const billing = subscription?.billingAddressId
    ? addresses.data?.find((address) => address.id === subscription.billingAddressId)
    : addresses.data?.find((address) => address.type === 'billing');

  const billingHistory =
    subscription && orders.data && productType !== 'policy'
      ? orders.data
          .filter((order) => subscription.relatedOrderIds.includes(order.id))
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];

  const policyBillingHistory =
    productType === 'policy' && orders.data
      ? orders.data
          .filter((order) => order.productType === 'policy')
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];

  function handleCancel() {
    if (!subscription) return;
    cancel.mutate(subscription.id, {
      onSuccess: () => {
        toast.success(t('cancelled'));
        confirm.close();
      },
    });
  }

  return (
    <>
      <DataState
        isLoading={subscriptions.isLoading}
        isError={subscriptions.isError}
        onRetry={() => void subscriptions.refetch()}
      >
        {subscriptions.data && !subscription ? <EmptyState message={t('empty')} /> : null}

        {subscription ? (
          <div className="divide-border flex flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
            <div className="divide-border flex min-w-0 flex-1 flex-col divide-y">
              <CurrentPlanPanel
                subscription={subscription}
                planTitle={t(`products.${productType}.planTitle`)}
                pricePeriod={t(`products.${productType}.pricePeriod`)}
                onCancel={() => {
                  confirm.open();
                }}
              />

              {productType === 'policy' && policyBillingHistory.length > 0 ? (
                <AccountSection title={tGeneratorPlan('billingHistory')} contentClassName="gap-0">
                  <AccountTable aria-label={tGeneratorPlan('billingHistory')}>
                    <Table.Header>
                      <Table.Column isRowHeader>{t('colInvoice')}</Table.Column>
                      <Table.Column>{t('colDate')}</Table.Column>
                      <Table.Column>{tGeneratorPlan('colSites')}</Table.Column>
                      <Table.Column className="text-right">{t('colAmount')}</Table.Column>
                      <Table.Column className="text-right">
                        <span className="sr-only">{t('colPdf')}</span>
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {policyBillingHistory.map((order) => (
                        <Table.Row key={order.id}>
                          <Table.Cell>
                            <span className="font-mono text-sm font-semibold">{order.number}</span>
                          </Table.Cell>
                          <Table.Cell>{formatDate(order.date)}</Table.Cell>
                          <Table.Cell>{order.siteCount ?? '—'}</Table.Cell>
                          <Table.Cell className="text-right">
                            <span className="text-foreground font-normal">
                              {formatMoney(order.total, order.currency)}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            <InvoiceDownloadButton
                              label={tGeneratorPlan('downloadInvoice')}
                              onPress={() => {
                                void handleInvoiceDownload(order.id, () => {
                                  toast.success(t('invoiceDownloadStarted'));
                                });
                              }}
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </AccountTable>
                </AccountSection>
              ) : null}

              {productType !== 'policy' && billingHistory.length > 0 ? (
                <AccountSection title={t('billingHistory')} contentClassName="gap-0">
                  <AccountTable aria-label={t('billingHistory')}>
                    <Table.Header>
                      <Table.Column isRowHeader>{t('colInvoice')}</Table.Column>
                      <Table.Column>{t('colDate')}</Table.Column>
                      <Table.Column className="text-right">{t('colAmount')}</Table.Column>
                      <Table.Column className="text-right">
                        <span className="sr-only">{t('colPdf')}</span>
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {billingHistory.map((order) => (
                        <Table.Row key={order.id}>
                          <Table.Cell>
                            <span className="font-mono text-sm font-semibold">{order.number}</span>
                          </Table.Cell>
                          <Table.Cell>{formatDate(order.date)}</Table.Cell>
                          <Table.Cell className="text-right">
                            <span className="text-foreground font-normal">
                              {formatMoney(order.total, order.currency)}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            <InvoiceDownloadButton
                              label={tOrders('downloadInvoice')}
                              onPress={() => {
                                void handleInvoiceDownload(order.id, () => {
                                  toast.success(t('invoiceDownloadStarted'));
                                });
                              }}
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </AccountTable>
                </AccountSection>
              ) : null}
            </div>

            <div className="divide-border flex w-full shrink-0 flex-col divide-y lg:w-[280px]">
              {billing ? (
                <AccountSection
                  size="small"
                  title={t('billingDetailsEyebrow')}
                  icon={<MapPin size={14} weight="fill" className="shrink-0" aria-hidden />}
                  action={
                    <NavigationLink
                      onPress={() => {
                        billingSelection.open();
                      }}
                      size="sm"
                      chevron="none"
                      className="shrink-0"
                    >
                      {t('change')}
                    </NavigationLink>
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
                <p className="text-foreground text-sm leading-relaxed">
                  {t(`products.${productType}.questionsBody`)}
                </p>
                <NavigationLink href={`/contact?subject=${CONTACT_SUBJECT[productType]}`} size="sm">
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

      <ConfirmDialog
        state={confirm}
        title={t('cancelTitle')}
        body={
          subscription?.nextPaymentDate
            ? t('cancelBody', {
                date: formatDate(endOfTermDate(subscription.nextPaymentDate)),
              })
            : t('cancelBody', { date: '—' })
        }
        confirmLabel={t('cancelConfirm')}
        cancelLabel={t('keepSubscription')}
        onConfirm={handleCancel}
        isPending={cancel.isPending}
      />

      {subscription ? (
        <BillingSelectionDialog
          state={billingSelection}
          subscription={subscription}
          onManage={onManagePayment}
        />
      ) : null}
    </>
  );
}
