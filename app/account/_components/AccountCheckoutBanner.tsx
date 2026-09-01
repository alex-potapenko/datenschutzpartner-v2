'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { countActivePolicySites, resolvePolicySiteCount, useSubscriptions } from '@/api/billing';
import { calculateGeneratorPolicyQuote, usePendingCheckout } from '@/api/checkout';
import { Timer } from '@/components/ui';
import { subscriptionDaysLeft } from './account-ui';
import { ACCOUNT_CHECKOUT_HREF } from './account-sections';
import { ServiceSubscriptionCard } from './ServiceSubscriptionCard';

type AccountCheckoutBannerProps = {
  siteDomain: string;
  subscriptionId: string;
};

export function AccountCheckoutBanner({ siteDomain, subscriptionId }: AccountCheckoutBannerProps) {
  const t = useTranslations('account.checkoutBanner');
  const tSiteSubscriptions = useTranslations('account.siteSubscriptions');
  const tMembership = useTranslations('account.membershipPanel');
  const tDocuments = useTranslations('account.documents');
  const router = useRouter();
  const pending = usePendingCheckout(siteDomain);
  const subscriptions = useSubscriptions();

  const subscription = subscriptions.data?.find((row) => row.id === subscriptionId);
  const activeSiteCount = countActivePolicySites(subscriptions.data ?? []);
  const quote = useMemo(
    () =>
      subscription
        ? calculateGeneratorPolicyQuote(activeSiteCount, resolvePolicySiteCount(subscription))
        : null,
    [activeSiteCount, subscription]
  );

  if (!pending.data?.needed || !subscription || !quote) return null;

  const trialEndsAt = subscription.trialEndsAt ?? pending.data.trialEndsAt;
  const trialPeriod =
    subscription.startDate && trialEndsAt
      ? subscriptionDaysLeft(subscription.startDate, trialEndsAt)
      : null;

  if (!trialPeriod) return null;

  const checkoutHref = `${ACCOUNT_CHECKOUT_HREF}?site=${encodeURIComponent(siteDomain)}`;

  return (
    <ServiceSubscriptionCard
      icon={<Timer size={20} weight="fill" />}
      accent="var(--accent)"
      iconTone="trial"
      title={t('sectionTitle')}
      state="trial"
      daysLeft={trialPeriod}
      daysLeftAriaLabel={tDocuments('daysLeft', { count: trialPeriod.remainingDays })}
      daysLeftSuffix={tSiteSubscriptions('daysLeftSuffix', { count: trialPeriod.remainingDays })}
      trialPricing={{
        currency: subscription.totals.currency,
        dueAmount: quote.amountDue,
        pricePeriod: tMembership('products.policy.pricePeriod'),
      }}
      duePaymentLabel={tSiteSubscriptions('duePaymentLabel')}
      renewalLabel={tSiteSubscriptions('renewalLabel')}
      renewalAfterPaymentNote={tSiteSubscriptions('renewalAfterPaymentNote')}
      aside={
        <div className="flex flex-col gap-3">
          <p className="text-foreground text-sm leading-relaxed">{t('trialExplainerLead')}</p>
          <p className="text-foreground text-sm leading-relaxed">{t('trialExplainerBody')}</p>
        </div>
      }
      onAction={() => {
        router.push(checkoutHref);
      }}
      actionLabel={t('cta')}
    />
  );
}
