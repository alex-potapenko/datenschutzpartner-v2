'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  useContinueSubscription,
  useOrders,
  useSubscriptions,
  countActivePolicySites,
  isPolicySubscriptionOnTrial,
  resolvePolicySiteCount,
  subscriptionRequiresPaidRenewal,
  type Subscription,
} from '@/api/billing';
import { calculateGeneratorPolicyQuote, usePendingCheckout } from '@/api/checkout';
import { Buildings, Button, Cookie, FileText, Plus, Spinner } from '@/components/ui';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { useSiteScope } from '@/components/shared/site-scope';
import {
  accountLocationHref,
  addWebsiteWizardHref,
  privacyPolicyAccountHref,
  subscriptionRenewalHref,
  withReturnTo,
} from '@/lib/account-routes';
import {
  AccountSection,
  AccountSectionFrame,
  subscriptionDaysLeft,
  useDateFormatter,
} from '../account-ui';
import { ACCOUNT_CHECKOUT_HREF } from '../account-sections';
import { BillingHistoryTable } from '../BillingHistoryTable';
import {
  ServiceSubscriptionCard,
  type ServiceSubscriptionCardState,
} from '../ServiceSubscriptionCard';
import {
  buildSubscriptionPricing,
  inactiveRenewalStatusNote,
} from '../SubscriptionPricingMetadata';

type ProductCardConfig = {
  id: string;
  icon: ReactNode;
  accent: string;
  title: string;
  state: ServiceSubscriptionCardState;
  statusBadge?: ReactNode;
  subscription: Subscription | null;
  muted?: boolean;
  description?: string;
  comingSoonNotice?: string;
  onAction?: () => void;
  actionLabel?: string;
  onContinue?: () => void;
  continueLabel?: string;
  isContinuing?: boolean;
  continueOpensCheckout?: boolean;
};

export function SubscriptionsSection() {
  const t = useTranslations('account.siteSubscriptions');
  const tSubs = useTranslations('account.subscriptions');
  const tMembership = useTranslations('account.membershipPanel');
  const tDashboard = useTranslations('account.dashboard');
  const tStatus = useTranslations('account.status');
  const tDocuments = useTranslations('account.documents');
  const tNav = useTranslations('account.nav');
  const tCheckout = useTranslations('account.checkoutBanner');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formatDate = useDateFormatter();

  const { activeSite, isLoading: sitesLoading } = useSiteScope();
  const subscriptions = useSubscriptions();
  const continueSubscription = useContinueSubscription();
  const orders = useOrders();
  const pendingCheckout = usePendingCheckout(activeSite?.domain ?? null);

  const isLoading = sitesLoading || subscriptions.isLoading || orders.isLoading;

  if (isLoading) {
    return (
      <AccountSectionFrame
        title={tNav('overview')}
        content={
          <div className="flex min-h-48 items-center justify-center py-12" aria-busy="true">
            <Spinner aria-label={tSubs('loading')} />
          </div>
        }
      />
    );
  }

  if (!activeSite) {
    return (
      <AccountSectionFrame
        title={tNav('overview')}
        content={
          <div className="-mx-4 sm:-mx-8">
            <div className="flex flex-col items-start gap-5 px-6 py-16 sm:px-8">
              <h2 className="text-foreground max-w-xl text-2xl font-bold sm:text-3xl">
                {tDashboard('empty.title')}
              </h2>
              <p className="text-muted max-w-xl text-base leading-relaxed">
                {tDashboard('empty.body')}
              </p>
              <Button
                variant="primary"
                size="md"
                className="gap-2"
                onPress={() => {
                  router.push(addWebsiteWizardHref(accountLocationHref(pathname, searchParams)));
                }}
              >
                <Plus size={18} weight="bold" aria-hidden />
                {tDashboard('empty.cta')}
              </Button>
            </div>
          </div>
        }
      />
    );
  }

  const document = activeSite.document;
  const subscriptionById = new Map((subscriptions.data ?? []).map((row) => [row.id, row]));
  const activeSiteCount = countActivePolicySites(subscriptions.data ?? []);
  const allOrders = orders.data ?? [];

  function subscriptionFor(id: string | undefined): Subscription | null {
    return id ? (subscriptionById.get(id) ?? null) : null;
  }

  function periodFor(row: Subscription | null, options?: { trial?: boolean }) {
    if (!row) return null;
    if (options?.trial && row.trialEndsAt && row.startDate) {
      return subscriptionDaysLeft(row.startDate, row.trialEndsAt);
    }
    if (!row.startDate || !row.nextPaymentDate) return null;
    return subscriptionDaysLeft(row.startDate, row.nextPaymentDate);
  }

  function buildCardProps(config: ProductCardConfig) {
    const period = periodFor(config.subscription, { trial: config.state === 'trial' });
    const pricing =
      config.subscription != null && config.state === 'active'
        ? {
            ...buildSubscriptionPricing(config.subscription, allOrders, activeSiteCount),
            pricePeriod: tMembership(`products.${config.subscription.productType}.pricePeriod`),
          }
        : null;
    const trialPricing =
      config.subscription != null && config.state === 'trial'
        ? (() => {
            const quote = calculateGeneratorPolicyQuote(
              activeSiteCount,
              resolvePolicySiteCount(config.subscription)
            );
            return {
              currency: config.subscription.totals.currency,
              dueAmount: quote.amountDue,
              pricePeriod: tMembership(`products.${config.subscription.productType}.pricePeriod`),
            };
          })()
        : null;
    const renewalInactiveNote =
      config.subscription &&
      (config.subscription.status === 'cancelled' || config.subscription.status === 'expired')
        ? inactiveRenewalStatusNote(config.subscription, formatDate, {
            cancelledOn: (params) => tMembership('cancelledOn', params),
            expiredOn: (params) => tMembership('expiredOn', params),
            accessUntil: (params) => tMembership('accessUntil', params),
          })
        : null;

    return {
      icon: config.icon,
      accent: config.accent,
      title: config.title,
      state: config.state,
      statusBadge: config.statusBadge,
      daysLeft: period,
      daysLeftAriaLabel: period ? tDocuments('daysLeft', { count: period.remainingDays }) : null,
      daysLeftSuffix: period ? t('daysLeftSuffix', { count: period.remainingDays }) : null,
      pricing,
      trialPricing,
      paidLabel: t('paidLabel'),
      renewalLabel: t('renewalLabel'),
      duePaymentLabel: t('duePaymentLabel'),
      renewalAfterPaymentNote: t('renewalAfterPaymentNote'),
      trialLabel: tNav('trial'),
      discountTooltipLabel: tMembership('renewalDiscountTooltipLabel'),
      discountTooltip: (params: { minSites: number; percent: string }) =>
        tMembership('renewalDiscountTooltip', params),
      renewalInactiveNote,
      notSubscribedLabel: t('notSubscribed'),
      comingSoonLabel: tNav('comingSoon'),
      comingSoonNotice: config.comingSoonNotice,
      description: config.description,
      muted: config.muted,
      onAction: config.onAction,
      actionLabel: config.actionLabel,
      onContinue: config.onContinue,
      continueLabel: config.continueLabel,
      isContinuing: config.isContinuing,
      continueOpensCheckout: config.continueOpensCheckout,
      equalHeight: true,
    };
  }

  const policySubscription = subscriptionFor(document?.subscriptionId);
  const policyOnTrial = policySubscription
    ? isPolicySubscriptionOnTrial(policySubscription)
    : false;
  const showPolicyCheckout =
    policyOnTrial && Boolean(pendingCheckout.data?.needed) && Boolean(activeSite.domain);

  const policyIsInactive =
    policySubscription?.status === 'cancelled' || policySubscription?.status === 'expired';
  const policyNeedsContinue =
    policyIsInactive ||
    (policySubscription?.status === 'active' && !policySubscription.nextPaymentDate);

  const productCards: ProductCardConfig[] = [
    {
      id: 'privacyPolicy',
      icon: <FileText size={20} weight="fill" />,
      accent: 'var(--accent)',
      title: tNav('privacyPolicy'),
      state: policyOnTrial ? 'trial' : policySubscription ? 'active' : 'notSubscribed',
      statusBadge:
        policySubscription && !policyOnTrial && policySubscription.status !== 'active' ? (
          <StatusPill tone={statusTone(policySubscription.status)}>
            {tStatus(policySubscription.status)}
          </StatusPill>
        ) : !policySubscription && document ? (
          <StatusPill tone="success">{tDashboard('products.privacyPolicy.statusLive')}</StatusPill>
        ) : undefined,
      subscription: policySubscription,
      onContinue: policyNeedsContinue
        ? () => {
            if (subscriptionRequiresPaidRenewal(policySubscription)) {
              router.push(
                subscriptionRenewalHref(
                  policySubscription.id,
                  privacyPolicyAccountHref({ site: activeSite.domain, tab: 'subscription' })
                )
              );
              return;
            }
            continueSubscription.mutate(policySubscription.id, {
              onSuccess: () => {
                toast.success(tMembership('continued'));
              },
            });
          }
        : undefined,
      continueLabel: tMembership('continueSubscription'),
      isContinuing: continueSubscription.isPending,
      continueOpensCheckout: subscriptionRequiresPaidRenewal(policySubscription),
      onAction: showPolicyCheckout
        ? () => {
            router.push(
              withReturnTo(
                `${ACCOUNT_CHECKOUT_HREF}?site=${encodeURIComponent(activeSite.domain)}`,
                accountLocationHref(pathname, searchParams)
              )
            );
          }
        : undefined,
      actionLabel: showPolicyCheckout ? tCheckout('cta') : undefined,
    },
    {
      id: 'cookieBanner',
      icon: <Cookie size={20} weight="fill" />,
      accent: 'var(--feature-yellow)',
      title: tNav('cookieBanner'),
      state: 'comingSoon',
      subscription: null,
      comingSoonNotice: t('comingSoonNotifyNote'),
      description: tDashboard('products.cookieBanner.body'),
    },
    {
      id: 'imprint',
      icon: <Buildings size={20} weight="fill" />,
      accent: 'var(--feature-teal)',
      title: tNav('imprint'),
      state: 'comingSoon',
      subscription: null,
      comingSoonNotice: t('comingSoonNotifyNote'),
      description: tDashboard('products.imprint.body'),
    },
  ];

  const subscribedIds = new Set([policySubscription?.id].filter(Boolean) as string[]);

  const payments = (orders.data ?? [])
    .filter((order) => (order.subscriptionId ? subscribedIds.has(order.subscriptionId) : false))
    .sort((a, b) => b.date.localeCompare(a.date));

  const policyCard = productCards[0];
  const secondaryCards = productCards.slice(1);

  if (!policyCard) {
    return (
      <AccountSectionFrame
        title={tNav('overview')}
        content={<p className="text-muted text-sm">{tDashboard('empty.body')}</p>}
      />
    );
  }

  return (
    <AccountSectionFrame
      title={tNav('overview')}
      content={
        <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
          <section aria-label={tDashboard('productsAriaLabel')} className="border-border border-b">
            <div className="border-border border-b [&>*]:h-full">
              <ServiceSubscriptionCard key={policyCard.id} {...buildCardProps(policyCard)} />
            </div>
            <div className="divide-border grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0 [&>*]:h-full">
              {secondaryCards.map((card) => (
                <ServiceSubscriptionCard key={card.id} {...buildCardProps(card)} />
              ))}
            </div>
          </section>

          <AccountSection title={tDashboard('recentPayments.title')} contentClassName="gap-0">
            {payments.length > 0 ? (
              <BillingHistoryTable
                orders={payments}
                ariaLabel={tDashboard('recentPayments.title')}
                showServiceColumn
                getServiceLabel={(order) =>
                  tDashboard(`recentPayments.services.${order.productType}`)
                }
              />
            ) : (
              <p className="text-muted text-sm">{t('noPayments')}</p>
            )}
          </AccountSection>
        </div>
      }
    />
  );
}
