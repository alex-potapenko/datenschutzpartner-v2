'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  countActivePolicySites,
  listEuRepSubscriptions,
  listPolicySubscriptions,
  resolveEuRepEntityCount,
  resolvePolicySiteCount,
  useCancelSubscription,
  useContinueSubscription,
  useOrders,
  useSubscriptions,
  type BillingProductType,
  type Order,
  type Subscription,
} from '@/api/billing';
import {
  calculateEuRepQuote,
  calculateGeneratorPolicyQuote,
  downloadOrderInvoice,
  generatorVolumeDiscountExplanation,
} from '@/api/checkout';
import { useAddresses } from '@/api/account';
import { useDocuments } from '@/api/documents';
import {
  useEuRepContracts,
  resolveEuRepContractForSubscription,
  type EuRepContract,
} from '@/api/eu-rep';
import {
  ArrowsClockwise,
  Button,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Question,
  Table,
  Tooltip,
  useOverlayState,
  cn,
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
  DaysLeftDonut,
  EmptyState,
  InvoiceDownloadButton,
  OrderAmount,
  SubscriptionIdLink,
  subscriptionDaysLeft,
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

function inactiveRenewalEndDate(subscription: Subscription): string | null {
  if (subscription.nextPaymentDate) {
    return endOfTermDate(subscription.nextPaymentDate);
  }
  const base = subscription.lastOrderDate ?? subscription.startDate;
  if (!base) return null;
  const date = new Date(`${base}T12:00:00`);
  date.setFullYear(date.getFullYear() + 1);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function hasSubscriptionAccessRemaining(endDateIso: string): boolean {
  return endDateIso.slice(0, 10) >= new Date().toISOString().slice(0, 10);
}

export function SubscriptionPlanActions({
  subscription,
  size = 'sm',
  showDownload = true,
}: {
  subscription: Subscription;
  size?: 'sm' | 'md';
  showDownload?: boolean;
}) {
  const t = useTranslations('account.membershipPanel');

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {showDownload ? (
        <Button
          variant="outline"
          size={size}
          className="gap-1.5"
          onPress={() => {
            const latestOrderId = subscription.relatedOrderIds.at(-1);
            if (latestOrderId) {
              void handleInvoiceDownload(latestOrderId, () => {
                toast.success(t('invoiceDownloadStarted'));
              });
            }
          }}
        >
          <FileText size={size === 'md' ? 16 : 14} aria-hidden />
          {t('downloadInvoice')}
        </Button>
      ) : null}
    </div>
  );
}

function CurrentPlanPanel({
  subscription,
  planTitle,
  pricePeriod,
  onCancel,
  onContinue,
  isContinuing = false,
  lastPaidAmount,
  paidSiteLabel,
  renewalAmount,
  renewalListPrice,
  discountExplanation,
  priceIncreased,
  hideHeader = false,
  hideDownload = false,
}: {
  subscription: Subscription;
  planTitle: string;
  pricePeriod: string;
  onCancel?: () => void;
  onContinue?: () => void;
  isContinuing?: boolean;
  lastPaidAmount: number;
  paidSiteLabel?: string;
  renewalAmount: number;
  renewalListPrice?: number;
  discountExplanation?: { minSites: number; percent: string } | null;
  priceIncreased?: boolean;
  /** Policy subscription detail — title and actions live in the page header. */
  hideHeader?: boolean;
  /** Subscription detail — download lives in billing history only. */
  hideDownload?: boolean;
}) {
  const t = useTranslations('account.membershipPanel');
  const tDocuments = useTranslations('account.documents');
  const ts = useTranslations('account.status');
  const formatDate = useDateFormatter();
  const [isDiscountTooltipOpen, setIsDiscountTooltipOpen] = useState(false);
  const [isRenewalReminderTooltipOpen, setIsRenewalReminderTooltipOpen] = useState(false);

  const { currency } = subscription.totals;
  const isRenewalInactive =
    subscription.status === 'cancelled' || subscription.status === 'expired';
  const showRenewalBlock =
    isRenewalInactive ||
    Boolean(
      subscription.nextPaymentDate &&
      (subscription.status === 'active' || subscription.status === 'processing')
    );
  const hasDiscount = Boolean(
    discountExplanation && renewalListPrice != null && renewalListPrice > renewalAmount
  );
  const renewalPeriod =
    subscription.startDate && subscription.nextPaymentDate
      ? subscriptionDaysLeft(subscription.startDate, subscription.nextPaymentDate)
      : null;
  const daysLeftLabel = renewalPeriod
    ? tDocuments('daysLeft', { count: renewalPeriod.remainingDays })
    : null;
  const inactiveEndDate = isRenewalInactive ? inactiveRenewalEndDate(subscription) : null;
  const inactiveDateLabel =
    inactiveEndDate && hasSubscriptionAccessRemaining(inactiveEndDate)
      ? subscription.status === 'expired'
        ? t('expiredWithAccess', { date: formatDate(inactiveEndDate) })
        : t('cancelledWithAccess', { date: formatDate(inactiveEndDate) })
      : inactiveEndDate && subscription.status === 'expired'
        ? t('expiredOn', { date: formatDate(inactiveEndDate) })
        : inactiveEndDate && subscription.status === 'cancelled'
          ? t('cancelledOn', { date: formatDate(inactiveEndDate) })
          : null;

  const renewsOnWithReminderTooltip = subscription.nextPaymentDate ? (
    <>
      <p className="text-muted text-sm">
        {t('renewsOn', { date: formatDate(subscription.nextPaymentDate) })}
      </p>
      <Tooltip
        delay={0}
        closeDelay={0}
        isOpen={isRenewalReminderTooltipOpen}
        onOpenChange={setIsRenewalReminderTooltipOpen}
      >
        <Tooltip.Trigger
          aria-label={t('renewalReminder')}
          className="text-accent hover:text-key-700 inline-flex cursor-pointer items-center justify-center"
          onPointerEnter={() => {
            setIsRenewalReminderTooltipOpen(true);
          }}
          onPointerLeave={() => {
            setIsRenewalReminderTooltipOpen(false);
          }}
        >
          <Info size={16} weight="bold" aria-hidden />
        </Tooltip.Trigger>
        <Tooltip.Content className="w-max max-w-xs p-3 text-sm leading-relaxed">
          {t('renewalReminder')}{' '}
          <NavigationLink
            href={`/terms#${TERMS_CONTRACT_DURATION_SECTION_ID}`}
            size="sm"
            className="inline-flex align-baseline"
          >
            {t('readMore')}
          </NavigationLink>
        </Tooltip.Content>
      </Tooltip>
    </>
  ) : null;

  return (
    <AccountSection
      title={hideHeader ? undefined : planTitle}
      titleAside={
        hideHeader ? undefined : (
          <StatusPill tone={statusTone(subscription.status)}>{ts(subscription.status)}</StatusPill>
        )
      }
      action={
        hideHeader ? undefined : (
          <SubscriptionPlanActions subscription={subscription} showDownload={!hideDownload} />
        )
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
              amount={lastPaidAmount.toFixed(2)}
              animatedAmount={lastPaidAmount}
              notes={[pricePeriod]}
              size="sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              {paidSiteLabel ? (
                <>
                  <p className="text-muted text-sm">{paidSiteLabel}</p>
                  <span className="text-muted text-sm" aria-hidden>
                    ·
                  </span>
                </>
              ) : null}
              <p className="text-muted text-sm">
                {t('paidOn', {
                  date: formatDate(subscription.lastOrderDate ?? subscription.startDate),
                })}
              </p>
            </div>
          </div>
        </div>

        {showRenewalBlock ? (
          <>
            <div
              className="bg-border h-px shrink-0 sm:h-auto sm:w-px sm:self-stretch"
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
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
                {!isRenewalInactive && onCancel ? (
                  <NavigationLink onPress={onCancel} size="sm" chevron="none" className="shrink-0">
                    {t('cancelCta')}
                  </NavigationLink>
                ) : null}
              </div>
              {isRenewalInactive ? (
                <div className="flex flex-col gap-3">
                  {inactiveDateLabel ? (
                    <p className="text-foreground text-sm leading-relaxed">{inactiveDateLabel}</p>
                  ) : null}
                  {onContinue ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onPress={onContinue}
                      isDisabled={isContinuing}
                    >
                      {t('continueSubscription')}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="flex min-w-0 flex-col gap-2">
                  {hasDiscount && renewalListPrice != null && discountExplanation ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-foreground text-sm leading-none font-bold">
                        {currency}
                      </span>
                      <span
                        className={`${priceBlockAmountClassName('sm')} text-muted/70 line-through decoration-from-font`}
                      >
                        {renewalListPrice.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`${priceBlockAmountClassName('sm')} text-danger`}>
                          {renewalAmount.toFixed(2)}
                        </span>
                        <Tooltip
                          delay={0}
                          closeDelay={0}
                          isOpen={isDiscountTooltipOpen}
                          onOpenChange={setIsDiscountTooltipOpen}
                        >
                          <Tooltip.Trigger
                            aria-label={t('renewalDiscountTooltipLabel')}
                            className="text-accent hover:text-key-700 inline-flex cursor-pointer items-center justify-center"
                            onPointerEnter={() => {
                              setIsDiscountTooltipOpen(true);
                            }}
                            onPointerLeave={() => {
                              setIsDiscountTooltipOpen(false);
                            }}
                          >
                            <Info size={16} weight="bold" aria-hidden />
                          </Tooltip.Trigger>
                          <Tooltip.Content className="w-max max-w-none p-3 text-sm break-normal whitespace-nowrap">
                            {t('renewalDiscountTooltip', {
                              minSites: discountExplanation.minSites,
                              percent: discountExplanation.percent,
                            })}
                          </Tooltip.Content>
                        </Tooltip>
                      </div>
                      <span className="text-muted text-xs leading-snug whitespace-nowrap">
                        {pricePeriod}
                      </span>
                    </div>
                  ) : (
                    <PriceBlock
                      currency={currency}
                      amount={renewalAmount.toFixed(2)}
                      animatedAmount={renewalAmount}
                      notes={[pricePeriod]}
                      size="sm"
                    />
                  )}
                  {renewalPeriod && daysLeftLabel ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <DaysLeftDonut
                        remaining={renewalPeriod.remainingDays}
                        total={renewalPeriod.totalDays}
                        label={daysLeftLabel}
                      />
                      <p className="text-muted text-sm">{daysLeftLabel}</p>
                      <span className="text-muted text-sm" aria-hidden>
                        ·
                      </span>
                      {renewsOnWithReminderTooltip}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {renewsOnWithReminderTooltip}
                    </div>
                  )}
                  {priceIncreased ? (
                    <p className="text-danger text-sm leading-relaxed">
                      {t('renewalPriceIncreased')}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AccountSection>
  );
}

/**
 * Billing detail for a yearly subscription — Academy membership, or a single
 * policy / EU Rep subscription on its detail screen.
 */
function lastOrderFor(subscription: Subscription, orders: Order[]): Order | undefined {
  return orders
    .filter((order) => subscription.relatedOrderIds.includes(order.id))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function legalEntityForEuRepOrder(
  order: Order,
  subscriptions: Subscription[],
  contracts: readonly EuRepContract[]
): string {
  const subscription =
    subscriptions.find((row) => row.relatedOrderIds.includes(order.id)) ??
    subscriptions.find((row) => row.id === order.subscriptionId);
  if (!subscription) return '—';
  return resolveEuRepContractForSubscription(contracts, subscription.id)?.legalEntity ?? '—';
}

export function MembershipPanel({
  productType,
  onManagePayment,
  subscriptionId,
}: {
  productType: BillingProductType;
  onManagePayment: () => void;
  /** When set, only this billing record is shown (policy / EU Rep detail). */
  subscriptionId?: string;
}) {
  const t = useTranslations('account.membershipPanel');
  const tFooter = useTranslations('footer');
  const tOrders = useTranslations('account.orders');
  const tGeneratorPlan = useTranslations('account.generatorPlan');
  const subscriptions = useSubscriptions();
  const orders = useOrders();
  const documents = useDocuments();
  const euRepContracts = useEuRepContracts();
  const addresses = useAddresses();
  const cancel = useCancelSubscription();
  const continueSubscription = useContinueSubscription();
  const confirm = useOverlayState();
  const billingSelection = useOverlayState();
  const formatDate = useDateFormatter();
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [billingTarget, setBillingTarget] = useState<Subscription | null>(null);
  const isDetailView = Boolean(subscriptionId);

  const policySubscriptions = listPolicySubscriptions(subscriptions.data ?? []);
  const euRepSubscriptions = listEuRepSubscriptions(subscriptions.data ?? []);
  const activeSiteCount = countActivePolicySites(subscriptions.data ?? []);
  const discountExplanation = generatorVolumeDiscountExplanation(activeSiteCount);

  const singleSubscription =
    productType === 'policy' || productType === 'euRep'
      ? undefined
      : subscriptions.data?.find((row) => row.productType === productType);
  const listedSubscriptions =
    productType === 'policy'
      ? policySubscriptions
      : productType === 'euRep'
        ? euRepSubscriptions
        : singleSubscription
          ? [singleSubscription]
          : [];
  const displayedSubscriptions = subscriptionId
    ? listedSubscriptions.filter((row) => row.id === subscriptionId)
    : listedSubscriptions;
  const sidebarSubscription = billingTarget ?? displayedSubscriptions[0];

  const billing = sidebarSubscription?.billingAddressId
    ? addresses.data?.find((address) => address.id === sidebarSubscription.billingAddressId)
    : addresses.data?.find((address) => address.type === 'billing');

  const focusedSubscription = displayedSubscriptions[0];

  const billingHistory =
    focusedSubscription && orders.data && productType === 'academy'
      ? orders.data
          .filter((order) => focusedSubscription.relatedOrderIds.includes(order.id))
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];

  const policyBillingHistory =
    productType === 'policy' && orders.data
      ? orders.data
          .filter((order) =>
            focusedSubscription
              ? focusedSubscription.relatedOrderIds.includes(order.id)
              : order.productType === 'policy'
          )
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];

  const euRepBillingHistory =
    productType === 'euRep' && orders.data
      ? orders.data
          .filter((order) =>
            focusedSubscription
              ? focusedSubscription.relatedOrderIds.includes(order.id)
              : order.productType === 'euRep'
          )
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];

  function handleCancel() {
    if (!cancelTarget) return;
    cancel.mutate(cancelTarget.id, {
      onSuccess: () => {
        toast.success(t('cancelled'));
        confirm.close();
        setCancelTarget(null);
      },
    });
  }

  return (
    <>
      <DataState
        isLoading={
          subscriptions.isLoading ||
          orders.isLoading ||
          (productType === 'policy' && documents.isLoading) ||
          (productType === 'euRep' && euRepContracts.isLoading)
        }
        isError={
          subscriptions.isError ||
          (productType === 'policy' && documents.isError) ||
          (productType === 'euRep' && euRepContracts.isError)
        }
        onRetry={() => {
          void subscriptions.refetch();
          void orders.refetch();
          if (productType === 'policy') {
            void documents.refetch();
          }
          if (productType === 'euRep') {
            void euRepContracts.refetch();
          }
        }}
      >
        {subscriptions.data && displayedSubscriptions.length === 0 ? (
          <EmptyState message={t('empty')} />
        ) : null}

        {displayedSubscriptions.length > 0 ? (
          <div
            className={cn(
              'divide-border flex flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0',
              isDetailView && 'min-h-0 flex-1 lg:items-stretch'
            )}
          >
            <div
              className={cn(
                'divide-border flex min-w-0 flex-1 flex-col divide-y',
                isDetailView && 'lg:min-h-full'
              )}
            >
              {displayedSubscriptions.map((subscription) => {
                const lastOrder = lastOrderFor(subscription, orders.data ?? []);
                const lastPaid = lastOrder?.total ?? subscription.totals.total;
                const isPolicy = productType === 'policy';
                const isEuRep = productType === 'euRep';
                const siteCount = isPolicy ? resolvePolicySiteCount(subscription) : 1;
                const euRepContract = isEuRep
                  ? resolveEuRepContractForSubscription(euRepContracts.data ?? [], subscription.id)
                  : undefined;
                const policyRenewalQuote = calculateGeneratorPolicyQuote(
                  activeSiteCount,
                  siteCount
                );
                const euRepRenewalQuote = calculateEuRepQuote(
                  isEuRep ? resolveEuRepEntityCount(subscription) : 1
                );
                const previousRate = lastOrder?.discountRate ?? 0;
                const priceIncreased =
                  isPolicy &&
                  subscription.status === 'active' &&
                  policyRenewalQuote.discountRate < previousRate;

                return (
                  <CurrentPlanPanel
                    key={subscription.id}
                    subscription={subscription}
                    hideHeader={Boolean(subscriptionId && isPolicy)}
                    hideDownload={Boolean(subscriptionId && (isPolicy || isEuRep))}
                    planTitle={
                      isPolicy || isEuRep
                        ? t('subscriptionIdTitle', { id: subscription.id })
                        : t(`products.${productType}.planTitle`)
                    }
                    pricePeriod={t(`products.${productType}.pricePeriod`)}
                    lastPaidAmount={lastPaid}
                    paidSiteLabel={
                      isPolicy
                        ? t('products.policy.planTitleWithSites', { count: siteCount })
                        : isEuRep
                          ? (euRepContract?.legalEntity ?? t('products.euRep.planTitle'))
                          : undefined
                    }
                    renewalAmount={
                      isPolicy
                        ? policyRenewalQuote.amountDue
                        : isEuRep
                          ? euRepRenewalQuote.amountDue
                          : subscription.totals.total
                    }
                    renewalListPrice={isPolicy ? policyRenewalQuote.listPrice : undefined}
                    discountExplanation={isPolicy ? discountExplanation : null}
                    priceIncreased={priceIncreased}
                    onCancel={
                      subscription.status === 'active'
                        ? () => {
                            setCancelTarget(subscription);
                            confirm.open();
                          }
                        : undefined
                    }
                    onContinue={
                      subscription.status === 'cancelled' || subscription.status === 'expired'
                        ? () => {
                            continueSubscription.mutate(subscription.id, {
                              onSuccess: () => {
                                toast.success(t('continued'));
                              },
                            });
                          }
                        : undefined
                    }
                    isContinuing={continueSubscription.isPending}
                  />
                );
              })}

              {productType === 'policy' && policyBillingHistory.length > 0 ? (
                <AccountSection title={tGeneratorPlan('billingHistory')} contentClassName="gap-0">
                  <AccountTable aria-label={tGeneratorPlan('billingHistory')}>
                    <Table.Header>
                      <Table.Column isRowHeader>{t('colInvoice')}</Table.Column>
                      <Table.Column className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
                        {t('colDate')}
                      </Table.Column>
                      <Table.Column className="w-32 max-w-32 shrink-0 text-right whitespace-nowrap">
                        {t('colAmount')}
                      </Table.Column>
                      <Table.Column className="w-0 shrink-0 whitespace-nowrap">
                        <span className="sr-only">{tGeneratorPlan('colActions')}</span>
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {policyBillingHistory.map((order) => (
                        <Table.Row key={order.id}>
                          <Table.Cell>
                            <span className="font-mono text-sm font-semibold">{order.number}</span>
                          </Table.Cell>
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
                              aria-label={tGeneratorPlan('downloadInvoice')}
                              onPress={() => {
                                void handleInvoiceDownload(order.id, () => {
                                  toast.success(t('invoiceDownloadStarted'));
                                });
                              }}
                            >
                              <FileText size={14} aria-hidden />
                              {tGeneratorPlan('colInvoice')}
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </AccountTable>
                </AccountSection>
              ) : null}

              {productType === 'euRep' && euRepBillingHistory.length > 0 ? (
                <AccountSection title={t('billingHistory')} contentClassName="gap-0">
                  <AccountTable aria-label={t('billingHistory')}>
                    <Table.Header>
                      <Table.Column isRowHeader>{t('colInvoice')}</Table.Column>
                      <Table.Column>{t('colSubscriptionId')}</Table.Column>
                      <Table.Column>{t('colDate')}</Table.Column>
                      <Table.Column>{t('colLegalEntity')}</Table.Column>
                      <Table.Column className="text-right">{t('colAmount')}</Table.Column>
                      <Table.Column className="w-0 shrink-0 whitespace-nowrap">
                        <span className="sr-only">{t('colPdf')}</span>
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {euRepBillingHistory.map((order) => (
                        <Table.Row key={order.id}>
                          <Table.Cell>
                            <span className="font-mono text-sm font-semibold">{order.number}</span>
                          </Table.Cell>
                          <Table.Cell>
                            {order.subscriptionId ? (
                              <SubscriptionIdLink id={order.subscriptionId} className="font-mono" />
                            ) : (
                              <span className="text-muted font-mono text-sm">—</span>
                            )}
                          </Table.Cell>
                          <Table.Cell>{formatDate(order.date)}</Table.Cell>
                          <Table.Cell>
                            {legalEntityForEuRepOrder(
                              order,
                              subscriptions.data ?? [],
                              euRepContracts.data ?? []
                            )}
                          </Table.Cell>
                          <Table.Cell className="text-right">
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
                              aria-label={tOrders('downloadInvoice')}
                              onPress={() => {
                                void handleInvoiceDownload(order.id, () => {
                                  toast.success(t('invoiceDownloadStarted'));
                                });
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
                </AccountSection>
              ) : null}

              {productType === 'academy' && billingHistory.length > 0 ? (
                <AccountSection title={t('billingHistory')} contentClassName="gap-0">
                  <AccountTable aria-label={t('billingHistory')}>
                    <Table.Header>
                      <Table.Column isRowHeader>{t('colInvoice')}</Table.Column>
                      <Table.Column>{t('colSubscriptionId')}</Table.Column>
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
                          <Table.Cell>
                            {order.subscriptionId ? (
                              <SubscriptionIdLink id={order.subscriptionId} className="font-mono" />
                            ) : (
                              <span className="text-muted font-mono text-sm">—</span>
                            )}
                          </Table.Cell>
                          <Table.Cell>{formatDate(order.date)}</Table.Cell>
                          <Table.Cell className="text-right">
                            <OrderAmount
                              total={order.total}
                              currency={order.currency}
                              discountRate={order.discountRate}
                              discountAmount={order.discountAmount}
                            />
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

            <div className="divide-border flex w-full shrink-0 flex-col divide-y lg:w-[320px]">
              {billing ? (
                <AccountSection
                  size="small"
                  title={t('billingDetailsEyebrow')}
                  icon={<MapPin size={14} weight="fill" className="shrink-0" aria-hidden />}
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
                  <NavigationLink
                    onPress={() => {
                      if (sidebarSubscription) {
                        setBillingTarget(sidebarSubscription);
                        billingSelection.open();
                      }
                    }}
                    size="sm"
                    chevron="none"
                  >
                    {t('change')}
                  </NavigationLink>
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
          cancelTarget?.nextPaymentDate
            ? t(cancelTarget.productType === 'euRep' ? 'cancelBodyEuRep' : 'cancelBody', {
                date: formatDate(endOfTermDate(cancelTarget.nextPaymentDate)),
              })
            : t(cancelTarget?.productType === 'euRep' ? 'cancelBodyEuRep' : 'cancelBody', {
                date: '—',
              })
        }
        confirmLabel={t('cancelConfirm')}
        cancelLabel={t('keepSubscription')}
        onConfirm={handleCancel}
        isPending={cancel.isPending}
      />

      {sidebarSubscription ? (
        <BillingSelectionDialog
          state={billingSelection}
          subscription={sidebarSubscription}
          onManage={onManagePayment}
        />
      ) : null}
    </>
  );
}
