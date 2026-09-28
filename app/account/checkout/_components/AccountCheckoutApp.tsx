'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { countActivePolicySites, useSubscriptions } from '@/api/billing';
import {
  calculatePendingTrialCheckoutQuote,
  formatDiscountPercent,
  useCompletePendingCheckout,
  usePendingCheckout,
} from '@/api/checkout';
import { useEuRepContracts } from '@/api/eu-rep';
import {
  ACCOUNT_CHECKOUT_HREF,
  PRIVACY_POLICY_ACCOUNT_HREF,
} from '@/app/account/_components/account-sections';
import type { EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import {
  formatCheckoutChf,
  ServiceCheckoutPlanCard,
  type CheckoutBreakdownLine,
} from '@/components/shared/ServiceCheckoutPlanCard';
import { GeneratorPerSitePriceNote } from '@/components/shared/GeneratorPerSitePriceNote';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import {
  VolumeDiscountNote,
  VolumeDiscountThresholdsDialog,
} from '@/components/shared/VolumeDiscountDialog';
import { privacyPolicyAccountHref, safeAccountReturnTo } from '@/lib/account-routes';
import { payrexxOrderLinesFromTrialCheckout } from '@/lib/payrexx-order-lines';
import { usePayrexxOrderLineLabels } from '@/lib/use-payrexx-order-line-labels';
import { usePayrexxPaymentFlow } from '@/lib/use-payrexx-payment-flow';
import { PayrexxPaymentScreen } from '@/components/shared/PayrexxPaymentScreen';
import { PaymentConfirmationCrossfade } from '@/components/shared/PaymentConfirmationCrossfade';
import { AccountCheckoutConfirmation } from '@/app/account/checkout/_components/AccountCheckoutConfirmation';
import { CheckoutPaymentButtonSpinner } from '@/components/shared/CheckoutPaymentButtonSpinner';
import { Button, CaretRight, Spinner, useOverlayState } from '@/components/ui';
import { cn } from '@/lib/utils';

const GENERATOR_INCLUDED_KEYS = [
  'services',
  'gdpr',
  'questions',
  'html',
  'fadp',
  'adjustments',
  'hosting',
  'pdf',
] as const;

function AccountCheckoutPageShell({
  backHref,
  backLabel,
  detailTitle,
  children,
}: {
  backHref: string;
  backLabel: string;
  detailTitle: string;
  children: ReactNode;
}) {
  return (
    <PolicyDetailPageShell backHref={backHref} backLabel={backLabel} detailTitle={detailTitle}>
      {children}
    </PolicyDetailPageShell>
  );
}

function CheckoutStatusPanel({
  children,
  center = false,
}: {
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`px-4 py-10 sm:px-8 ${center ? 'flex min-h-40 items-center justify-center' : 'flex flex-col items-center justify-center gap-4 text-center'}`}
    >
      {children}
    </div>
  );
}

function PolicyCheckoutPanel({
  domain,
  isFillSlot,
  fillSubscriptionId,
  quote,
  buyingEuRep,
  linkingExisting,
  legalEntity,
  linkedEntityName,
  euRepAmount,
  subtotalExclVat,
  footerAction,
  onOpenDiscountDialog,
}: {
  domain: string;
  isFillSlot: boolean;
  fillSubscriptionId?: string;
  quote: ReturnType<typeof calculatePendingTrialCheckoutQuote>['policyQuote'];
  buyingEuRep: boolean;
  linkingExisting: boolean;
  legalEntity: string;
  linkedEntityName: string;
  euRepAmount: number;
  subtotalExclVat: number;
  footerAction: ReactNode;
  onOpenDiscountDialog: () => void;
}) {
  const t = useTranslations('account.checkout');
  const tSummary = useTranslations('result.summary');
  const tGenerator = useTranslations('generatorPage');
  const tp = useTranslations('generatorPage.pricingSection');

  const plans: EuRepPlan[] = [
    {
      id: 'policy',
      tabLabel: '1',
      showPerYear: true,
      price: quote.amountDue.toFixed(2),
      note: <GeneratorPerSitePriceNote quote={quote} onOpenDiscountDialog={onOpenDiscountDialog} />,
    },
  ];

  const breakdownLines: CheckoutBreakdownLine[] = [
    {
      label: tSummary('generatorLine'),
      detail: isFillSlot
        ? tSummary('generatorLineSlotDetail', {
            id: fillSubscriptionId ?? '',
            domain,
          })
        : tSummary('generatorLineDetail', { domain }),
      amount: formatCheckoutChf(quote.amountDue),
    },
  ];

  if (!isFillSlot && quote.discountAmount > 0) {
    breakdownLines.push({
      label: (
        <VolumeDiscountNote
          label={tSummary('discountLine', {
            percent: formatDiscountPercent(quote.discountRate),
          })}
          onOpen={onOpenDiscountDialog}
        />
      ),
      amount: `− ${formatCheckoutChf(quote.discountAmount)}`,
      amountClassName: 'text-success',
    });
  }

  if (buyingEuRep) {
    breakdownLines.push({
      label: tSummary('euRepLine'),
      detail: tSummary('euRepLineDetailNamed', { entity: legalEntity }),
      amount: formatCheckoutChf(euRepAmount),
    });
  }

  if (linkingExisting) {
    breakdownLines.push({
      label: tSummary('euRepLinkLine'),
      detail: tSummary('euRepLinkLineDetail', {
        entity: linkedEntityName,
      }),
      amount: formatCheckoutChf(0),
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
      <ServiceCheckoutPlanCard
        plans={plans}
        selectedPlanId="policy"
        layout="standalone"
        pricePeriod={tp('pricePeriod')}
        tabsAriaLabel={tp('siteCountLabel')}
        selectPlanTitle={t('title')}
        includedTitle={tp('includedToggle')}
        features={GENERATOR_INCLUDED_KEYS.map((key) => tGenerator(`features.${key}`))}
        legal={tGenerator.rich('legalCheckout', {
          terms: (chunks) => <Link href="/terms">{chunks}</Link>,
        })}
        breakdownLines={breakdownLines}
        subtotalExclVat={subtotalExclVat}
        footerAction={footerAction}
      />
    </div>
  );
}

export function AccountCheckoutApp() {
  const t = useTranslations('account.checkout');
  const tNav = useTranslations('account.nav');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const checkoutTopBarTitle = `${tNav('privacyPolicy')} Checkout`;
  const orderLabels = usePayrexxOrderLineLabels();
  const searchParams = useSearchParams();
  const siteParam = searchParams.get('site');
  const { isChecking } = useRequireSession(ACCOUNT_CHECKOUT_HREF);
  const pending = usePendingCheckout(siteParam);
  const subscriptions = useSubscriptions();
  const euRepContracts = useEuRepContracts();
  const completePending = useCompletePendingCheckout(siteParam);
  const discountDialog = useOverlayState();
  // POC STUB (Payrexx): in-page simulation; production redirects to the session's Payrexx URL.
  const payrexx = usePayrexxPaymentFlow();
  const [confirmation, setConfirmation] = useState<{
    domain: string;
    legalEntity: string;
    policyAmount: number;
    euRepAmount: number;
    buyingEuRep: boolean;
  } | null>(null);

  const pendingData = pending.data;
  const linkedContract = euRepContracts.data?.find(
    (row) => row.id === pendingData?.euRepLinkContractId
  );
  const domain = pendingData?.domain ?? siteParam ?? '';
  const legalEntity =
    pendingData?.legalEntity ?? pendingData?.euRepEntities?.[0]?.legalEntity ?? '—';

  const backHref =
    safeAccountReturnTo(searchParams.get('returnTo')) ??
    (domain
      ? privacyPolicyAccountHref({ site: domain, tab: 'subscription' })
      : PRIVACY_POLICY_ACCOUNT_HREF);
  const backLabel = tCommon('back');

  const activeSites = countActivePolicySites(subscriptions.data ?? []);
  const checkoutQuote = useMemo(() => {
    if (!pendingData?.needed) return null;
    return calculatePendingTrialCheckoutQuote(pendingData, activeSites);
  }, [activeSites, pendingData]);

  const isFillSlot = checkoutQuote?.isFillSlot ?? Boolean(pendingData?.fillSubscriptionId);
  const buyingEuRep =
    checkoutQuote?.buyingEuRep ??
    Boolean(pendingData?.euRepEntityCount || pendingData?.euRepEntities?.length);
  const linkingExisting =
    checkoutQuote?.linkingExisting ?? Boolean(pendingData?.euRepLinkContractId);
  const quote = checkoutQuote?.policyQuote ?? {
    siteCount: 1,
    qualifyingSiteCount: activeSites,
    unitPrice: 0,
    discountRate: 0,
    listPrice: 0,
    discountAmount: 0,
    amountDue: 0,
  };
  const euRepAmount = checkoutQuote?.euRepAmount ?? 0;
  const subtotalExclVat = checkoutQuote?.subtotalExclVat ?? quote.amountDue;
  const payrexxOrderLines = useMemo(
    () =>
      payrexxOrderLinesFromTrialCheckout({
        domain,
        policyAmountExclVat: quote.amountDue,
        euRepAmountExclVat: buyingEuRep ? euRepAmount : 0,
        legalEntity,
        labels: orderLabels,
      }),
    [buyingEuRep, domain, euRepAmount, legalEntity, orderLabels, quote.amountDue]
  );

  function handlePay() {
    void payrexx.open(async () => {
      await completePending.mutateAsync();
      setConfirmation({
        domain,
        legalEntity,
        policyAmount: quote.amountDue,
        euRepAmount,
        buyingEuRep,
      });
    });
  }

  async function handlePayrexxPay() {
    try {
      await payrexx.pay();
    } catch {
      toast.error(t('paymentFailed'));
    }
  }

  const isContinueLoading = payrexx.isOpening;

  const payButton = (
    <Button
      variant="primary"
      size="lg"
      className={cn(
        'font-display h-14 w-full gap-2 rounded-full text-base',
        isContinueLoading && '!opacity-100'
      )}
      onPress={handlePay}
      isDisabled={isContinueLoading}
    >
      {isContinueLoading ? (
        <CheckoutPaymentButtonSpinner label={t('processing')} />
      ) : (
        <>
          {t('payCta')}
          <CaretRight size={16} weight="bold" aria-hidden />
        </>
      )}
    </Button>
  );

  if (payrexx.phase !== 'idle') {
    return (
      <PaymentConfirmationCrossfade
        phase={payrexx.phase}
        confirming={
          <PayrexxPaymentScreen
            items={payrexxOrderLines}
            amountExclVat={subtotalExclVat}
            isPaying={payrexx.isPaying}
            onPay={() => void handlePayrexxPay()}
            onCancel={payrexx.cancel}
          />
        }
        confirmed={
          confirmation ? (
            <AccountCheckoutConfirmation
              domain={confirmation.domain}
              legalEntity={confirmation.legalEntity}
              policyAmount={confirmation.policyAmount}
              euRepAmount={confirmation.euRepAmount}
              buyingEuRep={confirmation.buyingEuRep}
            />
          ) : null
        }
      />
    );
  }

  if (isChecking || pending.isLoading || subscriptions.isLoading) {
    return (
      <AccountCheckoutPageShell
        backHref={backHref}
        backLabel={backLabel}
        detailTitle={checkoutTopBarTitle}
      >
        <CheckoutStatusPanel center>
          <Spinner aria-label={tAccount('loading')} />
        </CheckoutStatusPanel>
      </AccountCheckoutPageShell>
    );
  }

  if (pending.isError) {
    return (
      <AccountCheckoutPageShell
        backHref={backHref}
        backLabel={backLabel}
        detailTitle={checkoutTopBarTitle}
      >
        <CheckoutStatusPanel>
          <p className="text-foreground text-base">{tAccount('error')}</p>
          <Button variant="outline" onPress={() => void pending.refetch()}>
            {tAccount('retry')}
          </Button>
        </CheckoutStatusPanel>
      </AccountCheckoutPageShell>
    );
  }

  if (!pendingData?.needed) {
    return (
      <AccountCheckoutPageShell
        backHref={backHref}
        backLabel={backLabel}
        detailTitle={checkoutTopBarTitle}
      >
        <CheckoutStatusPanel>
          <h2 className="text-foreground text-2xl font-semibold">{t('emptyTitle')}</h2>
          <p className="text-foreground max-w-md text-sm leading-relaxed">{t('emptyBody')}</p>
        </CheckoutStatusPanel>
      </AccountCheckoutPageShell>
    );
  }

  return (
    <AccountCheckoutPageShell
      backHref={backHref}
      backLabel={backLabel}
      detailTitle={checkoutTopBarTitle}
    >
      <PolicyCheckoutPanel
        domain={domain}
        isFillSlot={isFillSlot}
        fillSubscriptionId={pendingData.fillSubscriptionId}
        quote={quote}
        buyingEuRep={buyingEuRep}
        linkingExisting={linkingExisting}
        legalEntity={legalEntity}
        linkedEntityName={linkedContract?.legalEntity ?? '—'}
        euRepAmount={euRepAmount}
        subtotalExclVat={subtotalExclVat}
        footerAction={payButton}
        onOpenDiscountDialog={() => {
          discountDialog.open();
        }}
      />
      <VolumeDiscountThresholdsDialog state={discountDialog} />
    </AccountCheckoutPageShell>
  );
}
