'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { countActivePolicySites, useSubscriptions } from '@/api/billing';
import {
  calculateAmountInclVat,
  calculateEuRepQuote,
  calculateGeneratorPolicyQuote,
  calculateVatAmount,
  formatDiscountPercent,
  formatSwissVatPercent,
  GENERATOR_POLICY_UNIT_PRICE,
  POLICY_TRIAL_DAYS,
  qualifyingSiteCountForCheckout,
  useCompletePendingCheckout,
  usePendingCheckout,
} from '@/api/checkout';
import { useEuRepContracts } from '@/api/eu-rep';
import {
  ACCOUNT_CHECKOUT_HREF,
  PRIVACY_POLICY_ACCOUNT_HREF,
} from '@/app/account/_components/account-sections';
import { Button, CaretRight, Spinner } from '@/components/ui';
import { RegularPage } from '@/components/shared/RegularPage';

function formatChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

function PriceRow({
  label,
  detail,
  amount,
  amountClassName = 'text-foreground',
}: {
  label: string;
  detail?: string;
  amount: string;
  amountClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-foreground text-sm font-normal">{label}</p>
        {detail ? <p className="text-muted text-sm font-normal">{detail}</p> : null}
      </div>
      <p className={`shrink-0 text-sm font-semibold ${amountClassName}`}>{amount}</p>
    </div>
  );
}

export function AccountCheckoutApp() {
  const t = useTranslations('account.checkout');
  const tSummary = useTranslations('result.summary');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const tGenerator = useTranslations('generatorPage');
  const tp = useTranslations('generatorPage.pricingSection');
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteParam = searchParams.get('site');
  const { isChecking } = useRequireSession(ACCOUNT_CHECKOUT_HREF);
  const pending = usePendingCheckout(siteParam);
  const subscriptions = useSubscriptions();
  const euRepContracts = useEuRepContracts();
  const completePending = useCompletePendingCheckout(siteParam);

  const pendingData = pending.data;
  const isFillSlot = Boolean(pendingData?.fillSubscriptionId);
  const buyingEuRep = Boolean(pendingData?.euRepEntityCount || pendingData?.euRepEntities?.length);
  const linkingExisting = Boolean(pendingData?.euRepLinkContractId);
  const linkedContract = euRepContracts.data?.find(
    (row) => row.id === pendingData?.euRepLinkContractId
  );
  const domain = pendingData?.domain ?? '';
  const legalEntity =
    pendingData?.legalEntity ?? pendingData?.euRepEntities?.[0]?.legalEntity ?? '—';

  const activeSites = countActivePolicySites(subscriptions.data ?? []);
  const quote = useMemo(() => {
    if (isFillSlot) {
      return {
        amountDue: 0,
        discountAmount: 0,
        discountRate: 0,
        listPrice: 0,
      };
    }
    return calculateGeneratorPolicyQuote(
      qualifyingSiteCountForCheckout(activeSites, 'generator', 1),
      1
    );
  }, [activeSites, isFillSlot]);

  const euRepAmount = buyingEuRep ? calculateEuRepQuote('basis').amountDue : 0;
  const subtotalExclVat = quote.amountDue + euRepAmount;
  const vatAmount = calculateVatAmount(subtotalExclVat);
  const totalInclVat = calculateAmountInclVat(subtotalExclVat);

  async function handlePay() {
    try {
      toast.info(t('redirecting'));
      await new Promise((resolve) => setTimeout(resolve, 900));
      await completePending.mutateAsync();
      toast.success(t('paymentConfirmed'));
      router.push(PRIVACY_POLICY_ACCOUNT_HREF);
    } catch {
      toast.error(t('paymentFailed'));
    }
  }

  if (isChecking || pending.isLoading || subscriptions.isLoading) {
    return (
      <RegularPage
        topBarVariant="account"
        showFooter={false}
        noPadding
        minimal
        backLink={{ href: PRIVACY_POLICY_ACCOUNT_HREF, label: tCommon('back'), preferHref: true }}
      >
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </RegularPage>
    );
  }

  if (pending.isError) {
    return (
      <RegularPage
        topBarVariant="account"
        showFooter={false}
        noPadding
        minimal
        backLink={{ href: PRIVACY_POLICY_ACCOUNT_HREF, label: tCommon('back'), preferHref: true }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
          <p className="text-foreground text-base">{tAccount('error')}</p>
          <Button variant="outline" onPress={() => void pending.refetch()}>
            {tAccount('retry')}
          </Button>
        </div>
      </RegularPage>
    );
  }

  if (!pendingData?.needed) {
    return (
      <RegularPage
        topBarVariant="account"
        showFooter={false}
        noPadding
        minimal
        backLink={{ href: PRIVACY_POLICY_ACCOUNT_HREF, label: tCommon('back'), preferHref: true }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
          <h1 className="text-foreground text-2xl font-semibold">{t('emptyTitle')}</h1>
          <p className="text-foreground max-w-md text-sm leading-relaxed">{t('emptyBody')}</p>
        </div>
      </RegularPage>
    );
  }

  return (
    <RegularPage
      topBarVariant="account"
      showFooter={false}
      noPadding
      minimal
      backLink={{ href: PRIVACY_POLICY_ACCOUNT_HREF, label: tCommon('back'), preferHref: true }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-12 sm:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">{t('title')}</h1>
          <p className="text-foreground text-sm leading-relaxed">
            {t('trialBody', { days: POLICY_TRIAL_DAYS })}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <PriceRow
            label={tSummary('generatorLine')}
            detail={
              isFillSlot
                ? tSummary('generatorLineSlotDetail', {
                    id: pendingData.fillSubscriptionId ?? '',
                    domain,
                  })
                : tSummary('generatorLineDetail', { domain })
            }
            amount={formatChf(quote.amountDue)}
          />

          {!isFillSlot && quote.discountAmount > 0 ? (
            <PriceRow
              label={tSummary('discountLine', {
                percent: formatDiscountPercent(quote.discountRate),
              })}
              amount={`− ${formatChf(quote.discountAmount)}`}
              amountClassName="text-success"
            />
          ) : !isFillSlot ? (
            <p className="text-muted text-sm">
              {tp('perSite', { price: formatChf(GENERATOR_POLICY_UNIT_PRICE) })}
            </p>
          ) : null}

          {buyingEuRep ? (
            <PriceRow
              label={tSummary('euRepLine')}
              detail={tSummary('euRepLineDetailNamed', { entity: legalEntity })}
              amount={formatChf(euRepAmount)}
            />
          ) : null}

          {linkingExisting ? (
            <PriceRow
              label={tSummary('euRepLinkLine')}
              detail={tSummary('euRepLinkLineDetail', {
                entity: linkedContract?.legalEntity ?? '—',
              })}
              amount={formatChf(0)}
            />
          ) : null}

          <div className="border-border flex flex-col gap-3 border-t pt-4">
            <PriceRow label={tSummary('subtotalExclVat')} amount={formatChf(subtotalExclVat)} />
            <PriceRow
              label={tSummary('vatLine', { rate: formatSwissVatPercent() })}
              amount={formatChf(vatAmount)}
            />
            <PriceRow label={tSummary('totalInclVat')} amount={formatChf(totalInclVat)} />
            <PriceRow label={tSummary('dueToday')} amount={formatChf(totalInclVat)} />
          </div>
        </div>

        <p className="text-muted text-sm leading-relaxed">
          {tGenerator.rich('legal', {
            terms: (chunks) => <Link href="/terms">{chunks}</Link>,
          })}
        </p>

        <Button
          variant="primary"
          size="lg"
          className="font-display h-14 w-full gap-2 rounded-full text-base"
          onPress={() => void handlePay()}
          isDisabled={completePending.isPending}
        >
          {completePending.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" aria-hidden />
              {t('processing')}
            </span>
          ) : (
            <>
              {t('payCta')}
              <CaretRight size={16} weight="bold" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </RegularPage>
  );
}
