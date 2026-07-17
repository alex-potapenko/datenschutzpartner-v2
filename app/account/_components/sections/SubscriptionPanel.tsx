'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useCancelSubscription,
  useOrders,
  usePaymentMethods,
  useSubscriptions,
  type BillingProductType,
  type Order,
  type PaymentMethod,
  type Subscription,
} from '@/api/billing';
import { useAddresses } from '@/api/account';
import { Button, CheckCircle, Table, useOverlayState } from '@/components/ui';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PaymentCardBrandMark } from '@/components/shared/PaymentCardBrandMark';
import { ACADEMY_MEMBERSHIP_FEATURE_KEYS } from '@/lib/academy-content/events';
import { BillingSelectionDialog, type BillingSelectionKind } from '../BillingSelectionDialog';
import {
  AccountPanel,
  AccountTable,
  ConfirmDialog,
  DataState,
  EmptyState,
  InfoRow,
  InvoiceDownloadButton,
  formatMoney,
  useDateFormatter,
} from '../account-ui';

function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

const EU_REP_INCLUDED_KEYS = [
  'establishment',
  'art27',
  'mentionPolicy',
  'mentionRecords',
  'email',
  'post',
  'newsletter',
  'podcast',
] as const;

function orderReferenceLabel(
  order: Order,
  t: ReturnType<typeof useTranslations<'account.subscriptionPanel'>>
) {
  if (order.orderKind === 'extraInquiry') {
    return t('orderKindExtraInquiry');
  }

  if (order.orderKind === 'subscription') {
    return t('orderKindSubscription');
  }

  return null;
}

function AcademyPlanTerms() {
  const tFeatures = useTranslations('academy.landing.features');
  const tPanel = useTranslations('account.subscriptionPanel');

  return (
    <div className="border-border border-t pt-4">
      <h4 className="text-foreground mb-3 text-sm font-semibold">{tPanel('planTermsTitle')}</h4>
      <ul className="flex flex-col gap-2.5">
        {ACADEMY_MEMBERSHIP_FEATURE_KEYS.map((key) => (
          <li key={key} className="text-foreground flex items-start gap-2.5 text-sm">
            <CheckCircle
              size={16}
              weight="fill"
              className="mt-0.5 shrink-0"
              style={{ color: '#22c55e' }}
              aria-hidden
            />
            {tFeatures(key)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EuRepPlanTerms({ subscription }: { subscription: Subscription }) {
  const tFeatures = useTranslations('euRepPage.features');
  const tPricing = useTranslations('euRepPage.pricingSection');
  const tPanel = useTranslations('account.subscriptionPanel');
  const planId = subscription.planId ?? 'standard';

  return (
    <div className="border-border flex flex-col gap-4 border-t pt-4">
      <h4 className="text-foreground text-sm font-semibold">{tPanel('planTermsTitle')}</h4>
      <ul className="flex flex-col gap-2.5">
        {EU_REP_INCLUDED_KEYS.map((key) => (
          <li key={key} className="text-foreground flex items-start gap-2.5 text-sm">
            <CheckCircle
              size={16}
              weight="fill"
              className="mt-0.5 shrink-0"
              style={{ color: '#22c55e' }}
              aria-hidden
            />
            {tFeatures(key)}
          </li>
        ))}
      </ul>
      {tPricing.has(`plans.${planId}.includedCount`) ? (
        <dl className="flex flex-col gap-2">
          <InfoRow label={tPanel('includedInquiries')}>
            {tPanel('includedInquiriesValue', {
              count: Number(tPricing(`plans.${planId}.includedCount`)),
            })}
          </InfoRow>
          <InfoRow label={tPanel('extraInquiryPrice')}>
            CHF {tPricing(`plans.${planId}.furtherAmount`)} {tPricing('furtherInquiriesLabel')}
          </InfoRow>
        </dl>
      ) : null}
    </div>
  );
}

/**
 * Billing detail for a single product's subscription — shared between the
 * Academy "Membership" tab and the EU Rep "Subscription" tab. Membership and
 * subscription are the same underlying billing record; only the label
 * differs by business context.
 */
export function SubscriptionPanel({
  productType,
  onManagePayment,
}: {
  productType: BillingProductType;
  onManagePayment?: () => void;
}) {
  const t = useTranslations('account.subscriptionPanel');
  const tOrders = useTranslations('account.orders');
  const ts = useTranslations('account.status');
  const subscriptions = useSubscriptions();
  const addresses = useAddresses();
  const paymentMethods = usePaymentMethods();
  const orders = useOrders();
  const cancel = useCancelSubscription();
  const confirm = useOverlayState();
  const billingSelection = useOverlayState();
  const [billingSelectionKind, setBillingSelectionKind] =
    useState<BillingSelectionKind>('paymentMethod');
  const formatDate = useDateFormatter();

  const subscription = subscriptions.data?.find((row) => row.productType === productType);
  const billing = subscription?.billingAddressId
    ? addresses.data?.find((address) => address.id === subscription.billingAddressId)
    : addresses.data?.find((address) => address.type === 'billing');
  const linkedPaymentMethod: PaymentMethod | undefined = subscription?.paymentMethodId
    ? paymentMethods.data?.find((method) => method.id === subscription.paymentMethodId)
    : undefined;

  function openBillingSelection(kind: BillingSelectionKind) {
    setBillingSelectionKind(kind);
    billingSelection.open();
  }

  function handleCancel() {
    if (!subscription) return;
    cancel.mutate(subscription.id, {
      onSuccess: () => {
        toast.success(t('cancelled'));
        confirm.close();
      },
    });
  }

  const relatedOrders =
    subscription && orders.data
      ? orders.data
          .filter((order) => subscription.relatedOrderIds.includes(order.id))
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];

  return (
    <div className="flex flex-col gap-6">
      <DataState
        isLoading={subscriptions.isLoading}
        isError={subscriptions.isError}
        onRetry={() => void subscriptions.refetch()}
      >
        {subscriptions.data && !subscription ? <EmptyState message={t('empty')} /> : null}

        {subscription ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <AccountPanel
              className="lg:col-span-2"
              title={t('detailTitle')}
              action={
                <StatusPill tone={statusTone(subscription.status)}>
                  {ts(subscription.status)}
                </StatusPill>
              }
            >
              <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
                <h3 className="text-foreground text-lg font-bold">{subscription.product}</h3>
                <dl className="flex flex-col gap-3">
                  <InfoRow label={t('startDate')}>{formatDate(subscription.startDate)}</InfoRow>
                  <InfoRow label={t('lastOrder')}>{formatDate(subscription.lastOrderDate)}</InfoRow>
                  <InfoRow label={t('nextPayment')}>
                    {formatDate(subscription.nextPaymentDate)}
                  </InfoRow>
                  <InfoRow label={t('paymentMethod')}>
                    <div className="flex items-center justify-end gap-2">
                      {linkedPaymentMethod?.brand && linkedPaymentMethod.last4 ? (
                        <span className="inline-flex items-center gap-2">
                          <PaymentCardBrandMark brand={linkedPaymentMethod.brand} />
                          {formatCardBrand(linkedPaymentMethod.brand)} ••••{' '}
                          {linkedPaymentMethod.last4}
                        </span>
                      ) : (
                        // eslint-disable-next-line @typescript-eslint/no-deprecated -- legacy fallback when no linked payment method resolves
                        subscription.paymentMethod
                      )}
                      {subscription.status !== 'cancelled' ? (
                        <NavigationLink
                          onPress={() => {
                            openBillingSelection('paymentMethod');
                          }}
                          size="sm"
                        >
                          {t('changePaymentMethod')}
                        </NavigationLink>
                      ) : null}
                    </div>
                  </InfoRow>
                </dl>

                {productType === 'academy' ? <AcademyPlanTerms /> : null}
                {productType === 'euRep' ? <EuRepPlanTerms subscription={subscription} /> : null}

                {subscription.status !== 'cancelled' ? (
                  <div className="border-border mt-2 border-t pt-4">
                    <Button
                      variant="outline"
                      size="md"
                      className="text-danger"
                      onPress={() => {
                        confirm.open();
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </AccountPanel>

            <div className="flex flex-col gap-6">
              <AccountPanel title={t('totalsTitle')}>
                <div className="flex flex-col gap-3 px-5 py-5 sm:px-6">
                  <InfoRow label={subscription.totals.product}>
                    {formatMoney(subscription.totals.subtotal, subscription.totals.currency)}
                  </InfoRow>
                  <InfoRow label={t('discount')}>
                    {formatMoney(subscription.totals.discount, subscription.totals.currency)}
                  </InfoRow>
                  <div className="border-border border-t pt-3">
                    <InfoRow label={t('total')}>
                      <span className="text-foreground text-base font-bold">
                        {formatMoney(subscription.totals.total, subscription.totals.currency)}
                      </span>
                    </InfoRow>
                  </div>
                </div>
              </AccountPanel>

              {billing ? (
                <AccountPanel
                  title={t('billingAddress')}
                  action={
                    subscription.status !== 'cancelled' ? (
                      <NavigationLink
                        onPress={() => {
                          openBillingSelection('billingAddress');
                        }}
                        size="sm"
                      >
                        {t('editBillingAddress')}
                      </NavigationLink>
                    ) : undefined
                  }
                >
                  <address className="text-foreground px-5 py-5 text-sm leading-relaxed not-italic sm:px-6">
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
                </AccountPanel>
              ) : null}
            </div>

            {relatedOrders.length > 0 ? (
              <AccountPanel className="lg:col-span-3" title={t('relatedOrders')}>
                <AccountTable aria-label={t('relatedOrders')}>
                  <Table.Header>
                    <Table.Column isRowHeader>{tOrders('colNumber')}</Table.Column>
                    <Table.Column>{tOrders('colDate')}</Table.Column>
                    {productType === 'euRep' ? (
                      <Table.Column>{tOrders('colReference')}</Table.Column>
                    ) : null}
                    <Table.Column className="text-right">{tOrders('colTotal')}</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {relatedOrders.map((order) => (
                      <Table.Row key={order.id}>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{order.number}</span>
                            <InvoiceDownloadButton
                              label={tOrders('downloadInvoice')}
                              onPress={() => {
                                toast.success(tOrders('invoiceDownloadStarted'));
                              }}
                            />
                          </div>
                        </Table.Cell>
                        <Table.Cell>{formatDate(order.date)}</Table.Cell>
                        {productType === 'euRep' ? (
                          <Table.Cell>
                            {orderReferenceLabel(order, t) ?? tOrders('referenceEmpty')}
                          </Table.Cell>
                        ) : null}
                        <Table.Cell className="text-foreground text-right font-normal">
                          {formatMoney(order.total, order.currency)}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </AccountTable>
              </AccountPanel>
            ) : null}
          </div>
        ) : null}
      </DataState>

      <ConfirmDialog
        state={confirm}
        title={t('cancelConfirmTitle')}
        body={t('cancelConfirmBody')}
        confirmLabel={t('cancelConfirm')}
        cancelLabel={t('keep')}
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
    </div>
  );
}
