'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useCancelSubscription,
  useOrders,
  usePaymentMethods,
  useSubscriptions,
  type PaymentMethod,
  type Subscription,
} from '@/api/billing';
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
import { AcademyMembershipIncludesList } from '@/components/shared/AcademyMembershipIncludesList';
import { BillingSelectionDialog, type BillingSelectionKind } from '../BillingSelectionDialog';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { PaymentCardBrandMark } from '@/components/shared/PaymentCardBrandMark';
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

function endOfTermDate(nextPaymentDate: string): string {
  const date = new Date(nextPaymentDate);
  date.setDate(date.getDate() - 1);
  return date.toISOString();
}

function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

function NextPaymentPanel({
  subscription,
  paymentMethod,
  onChangePayment,
}: {
  subscription: Subscription;
  paymentMethod?: PaymentMethod;
  onChangePayment: () => void;
}) {
  const t = useTranslations('account.academyMembership');
  const formatDate = useDateFormatter();

  return (
    <AccountSection
      size="small"
      title={t('paymentMethodEyebrow')}
      icon={<CreditCard size={14} weight="fill" className="shrink-0" aria-hidden />}
      action={
        <NavigationLink onPress={onChangePayment} size="sm" chevron="none" className="shrink-0">
          {t('change')}
        </NavigationLink>
      }
    >
      <div className="flex flex-col gap-3">
        {paymentMethod?.type === 'card' && paymentMethod.brand && paymentMethod.last4 ? (
          <div className="flex min-w-0 items-center gap-3">
            <PaymentCardBrandMark brand={paymentMethod.brand} />
            <div className="min-w-0">
              <p className="text-foreground text-sm font-semibold">
                {formatCardBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
              </p>
              {paymentMethod.expMonth != null && paymentMethod.expYear != null ? (
                <p className="text-muted text-xs">
                  {t('cardExpires', {
                    month: String(paymentMethod.expMonth).padStart(2, '0'),
                    year: String(paymentMethod.expYear),
                  })}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-deprecated -- legacy fallback when no linked payment method resolves
          <p className="text-foreground text-sm font-semibold">{subscription.paymentMethod}</p>
        )}
        {subscription.nextPaymentDate ? (
          <p className="text-muted text-sm leading-relaxed">
            {t('renewalPaymentNote', { date: formatDate(subscription.nextPaymentDate) })}
          </p>
        ) : null}
      </div>
    </AccountSection>
  );
}

function CurrentPlanPanel({
  subscription,
  paymentMethod,
  onCancel,
}: {
  subscription: Subscription;
  paymentMethod?: PaymentMethod;
  onCancel?: () => void;
}) {
  const t = useTranslations('account.academyMembership');
  const tAcademy = useTranslations('academy.landing');
  const ts = useTranslations('account.status');
  const formatDate = useDateFormatter();

  const { total, currency } = subscription.totals;
  const isCancelled = subscription.status === 'cancelled';

  return (
    <AccountSection
      title={t('planTitle')}
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
              notes={[tAcademy('membershipPricePeriod')]}
              size="sm"
            />
            <p className="text-muted text-sm">
              {t('paidOn', {
                date: formatDate(subscription.lastOrderDate ?? subscription.startDate),
              })}
            </p>
            {paymentMethod?.type === 'card' && paymentMethod.brand && paymentMethod.last4 ? (
              <div className="flex items-center gap-3">
                <PaymentCardBrandMark brand={paymentMethod.brand} />
                <p className="text-foreground text-sm font-semibold">
                  {formatCardBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
                </p>
              </div>
            ) : null}
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
            toast.success(t('invoiceDownloadStarted'));
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

export function AcademyMembershipPanel({ onManagePayment }: { onManagePayment: () => void }) {
  const t = useTranslations('account.academyMembership');
  const tFooter = useTranslations('footer');
  const tPanel = useTranslations('account.subscriptionPanel');
  const tOrders = useTranslations('account.orders');
  const tFeatures = useTranslations('academy.landing.features');
  const subscriptions = useSubscriptions();
  const orders = useOrders();
  const paymentMethods = usePaymentMethods();
  const addresses = useAddresses();
  const cancel = useCancelSubscription();
  const confirm = useOverlayState();
  const billingSelection = useOverlayState();
  const [billingSelectionKind, setBillingSelectionKind] =
    useState<BillingSelectionKind>('paymentMethod');
  const formatDate = useDateFormatter();

  const subscription = subscriptions.data?.find((row) => row.productType === 'academy');
  const billing = subscription?.billingAddressId
    ? addresses.data?.find((address) => address.id === subscription.billingAddressId)
    : addresses.data?.find((address) => address.type === 'billing');
  const linkedPaymentMethod = subscription?.paymentMethodId
    ? paymentMethods.data?.find((method) => method.id === subscription.paymentMethodId)
    : undefined;

  const billingHistory =
    subscription && orders.data
      ? orders.data
          .filter((order) => subscription.relatedOrderIds.includes(order.id))
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];

  function handleCancel() {
    if (!subscription) return;
    cancel.mutate(subscription.id, {
      onSuccess: () => {
        toast.success(tPanel('cancelled'));
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
        {subscriptions.data && !subscription ? <EmptyState message={tPanel('empty')} /> : null}

        {subscription ? (
          <div className="divide-border flex flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
            <div className="divide-border flex min-w-0 flex-1 flex-col divide-y">
              <CurrentPlanPanel
                subscription={subscription}
                paymentMethod={linkedPaymentMethod}
                onCancel={() => {
                  confirm.open();
                }}
              />

              <AccountSection title={t('includesTitle')} contentClassName="gap-6">
                <AcademyMembershipIncludesList featureLabel={(key) => tFeatures(key)} />
              </AccountSection>

              {billingHistory.length > 0 ? (
                <AccountSection title={t('billingHistory')} contentClassName="gap-0">
                  <AccountTable aria-label={t('billingHistory')}>
                    <Table.Header>
                      <Table.Column isRowHeader>{t('colInvoice')}</Table.Column>
                      <Table.Column>{tOrders('colDate')}</Table.Column>
                      <Table.Column className="text-right">{t('colAmount')}</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {billingHistory.map((order) => (
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
              ) : null}
            </div>

            <div className="divide-border flex w-full shrink-0 flex-col divide-y lg:w-[280px]">
              {subscription.status !== 'cancelled' && subscription.nextPaymentDate ? (
                <NextPaymentPanel
                  subscription={subscription}
                  paymentMethod={linkedPaymentMethod}
                  onChangePayment={() => {
                    setBillingSelectionKind('paymentMethod');
                    billingSelection.open();
                  }}
                />
              ) : null}

              {billing ? (
                <AccountSection
                  size="small"
                  title={t('billingDetailsEyebrow')}
                  icon={<MapPin size={14} weight="fill" className="shrink-0" aria-hidden />}
                  action={
                    <NavigationLink
                      onPress={() => {
                        setBillingSelectionKind('billingAddress');
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
                <p className="text-foreground text-sm leading-relaxed">{t('questionsBody')}</p>
                <NavigationLink href="/contact?subject=academy" size="sm">
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
          kind={billingSelectionKind}
          subscription={subscription}
          onManage={onManagePayment}
        />
      ) : null}
    </>
  );
}
