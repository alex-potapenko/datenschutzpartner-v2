'use client';

import type { ReactNode } from 'react';
import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  countActivePolicySites,
  listEuRepSubscriptions,
  listPolicySubscriptions,
  listEuRepRequestedExtraRequests,
  listEuRepRequestUsages,
  resolveEuRepRemainingRequests,
  resolvePolicySiteCount,
  useCancelSubscription,
  useContinueSubscription,
  useCreateEuRepExtraRequest,
  useWithdrawEuRepExtraRequest,
  useOrders,
  hasSubscriptionAccessRemaining,
  subscriptionCoverageEnd,
  subscriptionTermEndDate,
  useSubscriptions,
  type BillingProductType,
  type Subscription,
} from '@/api/billing';
import {
  calculateGeneratorPolicyQuote,
  downloadOrderInvoice,
  EU_REP_EXTRA_REQUEST_PRICE,
  resolveEuRepPlan,
} from '@/api/checkout';
import { useBillingAddress } from '@/api/account';
import { useDocuments } from '@/api/documents';
import { useEuRepContracts } from '@/api/eu-rep';
import {
  ArrowsClockwise,
  Button,
  ChatTeardropText,
  CheckCircle,
  Chip,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Question,
  Stack,
  Tooltip,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  useOverlayState,
  cn,
} from '@/components/ui';
import { Field, TextInput } from '@/app/result/ui/FormSection';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { PriceBlock, priceBlockAmountClassName } from '@/components/shared/PriceBlock';
import { ACCOUNT_BILLING_DETAILS_HREF } from '@/lib/account-routes';
import { displayCountryLabel } from '@/lib/swiss-country';
import {
  buildSubscriptionPricing,
  lastOrderFor,
  type SubscriptionPricing,
} from '../SubscriptionPricingMetadata';
import {
  AccountSection,
  ConfirmDialog,
  DataState,
  DaysLeftDonut,
  EmptyState,
  subscriptionDaysLeft,
  formatMoney,
  useDateFormatter,
  useDateTimeFormatter,
} from '../account-ui';
import { BillingHistoryTable } from '../BillingHistoryTable';
import { EuRepPlanRequestsNote } from '@/app/eu-rep/_components/EuRepPlanRequestsNote';

/** Anchor for AGB §5 Vertragslaufzeit — must match `LegalMarkdown` heading ids in `terms.de.md`. */
const TERMS_CONTRACT_DURATION_SECTION_ID = '5-vertragslaufzeit';

const CONTACT_SUBJECT: Record<BillingProductType, string> = {
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
  return subscriptionTermEndDate(subscription);
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

/** Shared accent icon tile for status-style panel blocks. */
const STATUS_BLOCK_ICON_STYLE = {
  color: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
};

function EuRepExtraRequestDialog({
  subscription,
  state,
}: {
  subscription: Subscription;
  state: ReturnType<typeof useOverlayState>;
}) {
  const t = useTranslations('account.membershipPanel');
  const tCommon = useTranslations('common');
  const createExtraRequest = useCreateEuRepExtraRequest();
  const [quantity, setQuantity] = useState('1');

  function close() {
    setQuantity('1');
    state.close();
  }

  function submit() {
    const parsed = Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return;

    createExtraRequest.mutate(
      { subscriptionId: subscription.id, quantity: parsed },
      {
        onSuccess: () => {
          close();
        },
        onError: () => {
          toast.error(t('requestsExtraFailed'));
        },
      }
    );
  }

  return (
    <ModalRoot
      state={{
        ...state,
        setOpen: (open: boolean) => {
          if (!open) close();
          else state.setOpen(open);
        },
        close,
      }}
    >
      <ModalBackdrop isDismissable>
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('requestsRequestDialogTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-5">
                <p className="text-foreground text-sm leading-relaxed">
                  {t('requestsRequestDialogBody', {
                    price: formatMoney(EU_REP_EXTRA_REQUEST_PRICE, 'CHF'),
                  })}
                </p>
                <Field label={t('requestsRequestQuantityLabel')}>
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={quantity}
                    fullWidth={false}
                    className="w-16"
                    onChange={(event) => {
                      setQuantity(event.target.value);
                    }}
                  />
                </Field>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onPress={close}>
                {tCommon('cancel')}
              </Button>
              <Button
                variant="primary"
                isDisabled={createExtraRequest.isPending || Number.parseInt(quantity, 10) < 1}
                onPress={submit}
              >
                {t('requestsRequestSubmit')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}

export function EuRepRequestsSection({ subscription }: { subscription: Subscription }) {
  const t = useTranslations('account.membershipPanel');
  const formatDate = useDateFormatter();
  const formatDateTime = useDateTimeFormatter();
  const requestDialog = useOverlayState();
  const withdrawExtraRequest = useWithdrawEuRepExtraRequest();
  const remainingRequests = resolveEuRepRemainingRequests(subscription);
  const requestUsages = listEuRepRequestUsages(subscription);
  const requestedExtraRequests = listEuRepRequestedExtraRequests(subscription);
  const canAddExtra = subscription.status === 'active';

  return (
    <AccountSection title={t('sectionRequests')} contentClassName="gap-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={STATUS_BLOCK_ICON_STYLE}
              aria-hidden
            >
              <ChatTeardropText size={18} weight="fill" />
            </span>
            <h3 className="text-foreground text-sm font-semibold">{t('requestsAvailableLabel')}</h3>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={priceBlockAmountClassName('sm')}
                aria-label={`${t('requestsAvailableLabel')}: ${remainingRequests}`}
              >
                {remainingRequests}
              </p>
              {requestedExtraRequests.length === 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  isDisabled={!canAddExtra}
                  onPress={() => {
                    requestDialog.open();
                  }}
                >
                  {t('requestsRequestCta')}
                </Button>
              ) : null}
              {requestedExtraRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-2">
                  <Chip variant="soft" size="sm" color="warning">
                    {t('requestsRequestedChip', {
                      count: request.quantity,
                      date: formatDate(request.requestedDate),
                    })}
                  </Chip>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    isDisabled={withdrawExtraRequest.isPending}
                    onPress={() => {
                      withdrawExtraRequest.mutate(
                        { subscriptionId: subscription.id, requestId: request.id },
                        {
                          onSuccess: () => {
                            toast.success(t('requestsWithdrawn'));
                          },
                          onError: () => {
                            toast.error(t('requestsWithdrawFailed'));
                          },
                        }
                      );
                    }}
                  >
                    {t('requestsWithdrawCta')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-border h-px shrink-0 sm:h-auto sm:w-px sm:self-stretch" aria-hidden />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={STATUS_BLOCK_ICON_STYLE}
              aria-hidden
            >
              <CheckCircle size={18} weight="fill" />
            </span>
            <h3 className="text-foreground text-sm font-semibold">{t('requestsUsageLabel')}</h3>
          </div>
          <div className="flex flex-col gap-2">
            {requestUsages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {requestUsages.map((usage, index) => (
                  <Chip key={`${usage.date}-${index}`} variant="soft" size="lg" color="default">
                    {formatDateTime(usage.date)}
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm leading-snug">{t('requestsNoneUsed')}</p>
            )}
          </div>
        </div>
      </div>
      <EuRepExtraRequestDialog subscription={subscription} state={requestDialog} />
    </AccountSection>
  );
}

function CurrentPlanPanel({
  subscription,
  planTitle,
  pricing,
  onCancel,
  onContinue,
  isContinuing = false,
  priceIncreased,
  hideHeader = false,
  hideDownload = false,
}: {
  subscription: Subscription;
  planTitle: string;
  pricing: SubscriptionPricing;
  onCancel?: () => void;
  onContinue?: () => void;
  isContinuing?: boolean;
  priceIncreased?: boolean;
  /** Policy subscription detail — title and actions live in the page header. */
  hideHeader?: boolean;
  /** Subscription detail — download lives in billing history only. */
  hideDownload?: boolean;
}) {
  const t = useTranslations('account.membershipPanel');
  const tDocuments = useTranslations('account.documents');
  const tEuRepPlans = useTranslations('euRepPage.plans');
  const ts = useTranslations('account.status');
  const formatDate = useDateFormatter();
  const { currency } = subscription.totals;
  const isEuRep = subscription.productType === 'euRep';
  const euRepPlanId = isEuRep ? resolveEuRepPlan(subscription.planId).id : null;
  const [isDiscountTooltipOpen, setIsDiscountTooltipOpen] = useState(false);
  const [isRenewalReminderTooltipOpen, setIsRenewalReminderTooltipOpen] = useState(false);
  const isRenewalInactive =
    subscription.status === 'cancelled' ||
    subscription.status === 'expired' ||
    (subscription.status === 'active' && !subscription.nextPaymentDate);
  const coverageEnd = subscriptionCoverageEnd(subscription);
  const showRenewalBlock =
    isRenewalInactive ||
    Boolean(
      coverageEnd && (subscription.status === 'active' || subscription.status === 'processing')
    );
  const hasDiscount = Boolean(
    pricing.discountExplanation &&
    pricing.renewalListPrice != null &&
    pricing.renewalListPrice > pricing.renewalAmount
  );
  const renewalPeriod =
    subscription.startDate && coverageEnd
      ? subscriptionDaysLeft(subscription.startDate, coverageEnd)
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
        <Tooltip.Content className="w-max max-w-none p-3 text-sm whitespace-nowrap">
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
        {isEuRep && euRepPlanId ? (
          <>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={STATUS_BLOCK_ICON_STYLE}
                  aria-hidden
                >
                  <Stack size={18} weight="fill" />
                </span>
                <h3 className="text-foreground text-sm font-semibold">{t('sectionPlan')}</h3>
              </div>
              <div className="flex flex-col gap-2">
                <p className={priceBlockAmountClassName('sm')}>
                  {tEuRepPlans(`${euRepPlanId}.name`)}
                </p>
                <EuRepPlanRequestsNote
                  planId={euRepPlanId}
                  previousPlanId={euRepPlanId}
                  direction={0}
                  variant="block"
                  tone="muted"
                  animateCount={false}
                />
              </div>
            </div>
            <div
              className="bg-border h-px shrink-0 sm:h-auto sm:w-px sm:self-stretch"
              aria-hidden
            />
          </>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={STATUS_BLOCK_ICON_STYLE}
              aria-hidden
            >
              <CreditCard size={18} weight="fill" />
            </span>
            <h3 className="text-foreground text-sm font-semibold">{t('sectionPayment')}</h3>
          </div>
          <div className="flex flex-col gap-2">
            <PriceBlock
              currency={currency}
              amount={pricing.annualAmount.toFixed(2)}
              animatedAmount={pricing.annualAmount}
              notes={[pricing.pricePeriod]}
              size="sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-muted text-sm">
                {t('paidOn', { date: formatDate(pricing.paidDate) })}
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
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={STATUS_BLOCK_ICON_STYLE}
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
                  {hasDiscount &&
                  pricing.renewalListPrice != null &&
                  pricing.discountExplanation ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-foreground text-sm leading-none font-bold">
                        {currency}
                      </span>
                      <span
                        className={`${priceBlockAmountClassName('sm')} text-muted/70 line-through decoration-from-font`}
                      >
                        {pricing.renewalListPrice.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`${priceBlockAmountClassName('sm')} text-danger`}>
                          {pricing.renewalAmount.toFixed(2)}
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
                          <Tooltip.Content className="w-max max-w-none p-3 text-sm whitespace-nowrap">
                            {t('renewalDiscountTooltip', {
                              minSites: pricing.discountExplanation.minSites,
                              percent: pricing.discountExplanation.percent,
                            })}
                          </Tooltip.Content>
                        </Tooltip>
                      </div>
                      <span className="text-muted text-xs leading-snug whitespace-nowrap">
                        {pricing.pricePeriod}
                      </span>
                    </div>
                  ) : (
                    <PriceBlock
                      currency={currency}
                      amount={pricing.renewalAmount.toFixed(2)}
                      animatedAmount={pricing.renewalAmount}
                      notes={[pricing.pricePeriod]}
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
export function MembershipPanel({
  productType,
  subscriptionId,
  hideSidebar = false,
  sidebar,
  hidePlanHeader = true,
}: {
  productType: BillingProductType;
  /** When set, only this billing record is shown (policy / EU Rep detail). */
  subscriptionId?: string;
  /** Omit the default billing-details sidebar (service section tabs). */
  hideSidebar?: boolean;
  /** Custom right column — replaces the default sidebar when provided. */
  sidebar?: ReactNode;
  /** Hide the plan title row in focused policy subscription views (standalone detail pages). */
  hidePlanHeader?: boolean;
}) {
  const t = useTranslations('account.membershipPanel');
  const tCommon = useTranslations('common');
  const tFooter = useTranslations('footer');
  const tGeneratorPlan = useTranslations('account.generatorPlan');
  const subscriptions = useSubscriptions();
  const orders = useOrders();
  const documents = useDocuments();
  const euRepContracts = useEuRepContracts();
  const billingAddress = useBillingAddress();
  const cancel = useCancelSubscription();
  const continueSubscription = useContinueSubscription();
  const confirm = useOverlayState();
  const formatDate = useDateFormatter();
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const isDetailView = Boolean(subscriptionId);

  const policySubscriptions = listPolicySubscriptions(subscriptions.data ?? []);
  const euRepSubscriptions = listEuRepSubscriptions(subscriptions.data ?? []);
  const activeSiteCount = countActivePolicySites(subscriptions.data ?? []);

  const listedSubscriptions = productType === 'policy' ? policySubscriptions : euRepSubscriptions;
  const isServiceScopedView = hideSidebar || isDetailView;
  const displayedSubscriptions = subscriptionId
    ? listedSubscriptions.filter((row) => row.id === subscriptionId)
    : isServiceScopedView
      ? []
      : listedSubscriptions;
  const billing = billingAddress.data;

  const focusedSubscription = displayedSubscriptions[0];

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

  const billingHistory = productType === 'policy' ? policyBillingHistory : euRepBillingHistory;
  const billingHistoryTitle =
    productType === 'policy' ? tGeneratorPlan('billingHistory') : t('billingHistory');

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

  const showDefaultSidebar = !hideSidebar && sidebar === undefined;
  const showRightColumn = showDefaultSidebar || sidebar != null;

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
              'divide-border flex flex-col divide-y',
              showRightColumn && 'lg:flex-row lg:divide-x lg:divide-y-0',
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
                const isPolicy = productType === 'policy';
                const isEuRep = productType === 'euRep';
                const siteCount = isPolicy ? resolvePolicySiteCount(subscription) : 1;
                const policyRenewalQuote = calculateGeneratorPolicyQuote(
                  activeSiteCount,
                  siteCount
                );
                const previousRate = lastOrder?.discountRate ?? 0;
                const priceIncreased =
                  isPolicy &&
                  subscription.status === 'active' &&
                  policyRenewalQuote.discountRate < previousRate;
                const pricing: SubscriptionPricing = {
                  ...buildSubscriptionPricing(subscription, orders.data ?? [], activeSiteCount),
                  pricePeriod: t(`products.${productType}.pricePeriod`),
                };

                return (
                  <Fragment key={subscription.id}>
                    <CurrentPlanPanel
                      subscription={subscription}
                      hideHeader={Boolean(subscriptionId && isPolicy && hidePlanHeader)}
                      hideDownload={Boolean(subscriptionId && (isPolicy || isEuRep))}
                      planTitle={t(`products.${productType}.planTitle`)}
                      pricing={pricing}
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
                        subscription.status === 'cancelled' ||
                        subscription.status === 'expired' ||
                        (subscription.status === 'active' && !subscription.nextPaymentDate)
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
                    {isEuRep ? <EuRepRequestsSection subscription={subscription} /> : null}
                  </Fragment>
                );
              })}

              {billingHistory.length > 0 ? (
                <AccountSection title={billingHistoryTitle} contentClassName="gap-0">
                  <BillingHistoryTable orders={billingHistory} ariaLabel={billingHistoryTitle} />
                </AccountSection>
              ) : null}
            </div>

            {showRightColumn ? (
              sidebar != null ? (
                <div className="border-border w-full shrink-0 lg:w-[320px] lg:border-l">
                  {sidebar}
                </div>
              ) : (
                <div className="divide-border flex w-full shrink-0 flex-col divide-y lg:w-[320px]">
                  {billing ? (
                    <AccountSection
                      size="small"
                      title={t('billingDetailsEyebrow')}
                      icon={<MapPin size={14} weight="fill" className="shrink-0" aria-hidden />}
                    >
                      <address className="text-foreground text-sm leading-relaxed not-italic">
                        {billing.billingEmail}
                        <br />
                        {billing.firstName} {billing.lastName}
                        <br />
                        {billing.company ? (
                          <>
                            {billing.company}
                            <br />
                          </>
                        ) : null}
                        {billing.department ? (
                          <>
                            {billing.department}
                            <br />
                          </>
                        ) : null}
                        {billing.line1}
                        <br />
                        {billing.line2 ? (
                          <>
                            {billing.line2}
                            <br />
                          </>
                        ) : null}
                        {billing.postalCode} {billing.city}
                        <br />
                        {displayCountryLabel(billing.country, tCommon('countrySwitzerland'))}
                        {billing.vatId ? (
                          <>
                            <br />
                            {billing.vatId}
                          </>
                        ) : null}
                      </address>
                      <NavigationLink href={ACCOUNT_BILLING_DETAILS_HREF} size="sm" chevron="none">
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
                    <NavigationLink
                      href={`/contact?subject=${CONTACT_SUBJECT[productType]}`}
                      size="sm"
                    >
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
              )
            ) : null}
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
    </>
  );
}
