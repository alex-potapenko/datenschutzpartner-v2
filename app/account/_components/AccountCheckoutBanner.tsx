'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { countActivePolicySites, useSubscriptions } from '@/api/billing';
import { calculatePendingTrialCheckoutQuote, usePendingCheckout } from '@/api/checkout';
import {
  TrialPeriodNotice,
  type TrialPeriodNoticeVariant,
} from '@/components/shared/TrialPeriodNotice';
import { euRepAccountHref, privacyPolicyAccountHref, withReturnTo } from '@/lib/account-routes';
import { subscriptionDaysLeft } from './account-ui';
import { ACCOUNT_CHECKOUT_HREF } from './account-sections';
import { ServiceSubscriptionCard } from './ServiceSubscriptionCard';

type AccountCheckoutBannerProps = {
  siteDomain: string;
  /** Policy subscription used for checkout pricing. */
  subscriptionId: string;
  /** Where to return after checkout — defaults to the policy subscription tab. */
  returnTo?: string;
  /** Trial notice copy in the aside. */
  trialNoticeVariant?: TrialPeriodNoticeVariant;
  /** Subscription that drives the days-left counter — defaults to `subscriptionId`. */
  daysLeftSubscriptionId?: string;
};

export function AccountCheckoutBanner({
  siteDomain,
  subscriptionId,
  returnTo,
  trialNoticeVariant = 'policy',
  daysLeftSubscriptionId,
}: AccountCheckoutBannerProps) {
  const t = useTranslations('account.checkoutBanner');
  const tSiteSubscriptions = useTranslations('account.siteSubscriptions');
  const tMembership = useTranslations('account.membershipPanel');
  const tDocuments = useTranslations('account.documents');
  const router = useRouter();
  const pending = usePendingCheckout(siteDomain);
  const subscriptions = useSubscriptions();

  const policySubscription = subscriptions.data?.find((row) => row.id === subscriptionId);
  const daysLeftSubscription = subscriptions.data?.find(
    (row) => row.id === (daysLeftSubscriptionId ?? subscriptionId)
  );
  const activeSiteCount = countActivePolicySites(subscriptions.data ?? []);

  const checkoutQuote = useMemo(() => {
    if (!pending.data?.needed) return null;
    return calculatePendingTrialCheckoutQuote(pending.data, activeSiteCount);
  }, [activeSiteCount, pending.data]);

  if (!pending.data?.needed || !policySubscription || !checkoutQuote) return null;

  const resolvedTrialNoticeVariant =
    trialNoticeVariant === 'policy' && (checkoutQuote.buyingEuRep || checkoutQuote.linkingExisting)
      ? 'policyAndEuRep'
      : trialNoticeVariant;

  const trialEndsAt =
    daysLeftSubscription?.trialEndsAt ?? policySubscription.trialEndsAt ?? pending.data.trialEndsAt;
  const trialStartDate = daysLeftSubscription?.startDate ?? policySubscription.startDate;
  const trialPeriod =
    trialStartDate && trialEndsAt ? subscriptionDaysLeft(trialStartDate, trialEndsAt) : null;

  if (!trialPeriod) return null;

  const checkoutHref = withReturnTo(
    `${ACCOUNT_CHECKOUT_HREF}?site=${encodeURIComponent(siteDomain)}`,
    returnTo ?? privacyPolicyAccountHref({ site: siteDomain, tab: 'subscription' })
  );

  const currency = policySubscription.totals.currency;

  return (
    <ServiceSubscriptionCard
      title={t('sectionTitle')}
      state="trial"
      daysLeft={trialPeriod}
      daysLeftAriaLabel={tDocuments('daysLeft', { count: trialPeriod.remainingDays })}
      daysLeftSuffix={tSiteSubscriptions('daysLeftSuffix', { count: trialPeriod.remainingDays })}
      trialPricing={{
        currency,
        dueAmount: checkoutQuote.subtotalExclVat,
        pricePeriod: tMembership('products.policy.pricePeriod'),
      }}
      duePaymentLabel={tSiteSubscriptions('duePaymentLabel')}
      renewalLabel={tSiteSubscriptions('renewalLabel')}
      renewalAfterPaymentNote={tSiteSubscriptions('renewalAfterPaymentNote')}
      aside={<TrialPeriodNotice variant={resolvedTrialNoticeVariant} showTitle={false} />}
      onAction={() => {
        router.push(checkoutHref);
      }}
      actionLabel={t('cta')}
    />
  );
}

export function EuRepAccountCheckoutBanner({
  siteDomain,
  policySubscriptionId,
  contractId,
  euRepSubscriptionId,
  trialNoticeVariant = 'policyAndEuRep',
}: {
  siteDomain: string;
  policySubscriptionId: string;
  contractId: string;
  euRepSubscriptionId: string;
  trialNoticeVariant?: TrialPeriodNoticeVariant;
}) {
  return (
    <AccountCheckoutBanner
      siteDomain={siteDomain}
      subscriptionId={policySubscriptionId}
      daysLeftSubscriptionId={euRepSubscriptionId}
      trialNoticeVariant={trialNoticeVariant}
      returnTo={euRepAccountHref({ contract: contractId, tab: 'subscription' })}
    />
  );
}
