'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useOrders,
  useSubscriptions,
  countActivePolicySites,
  isPolicySubscriptionOnTrial,
  resolvePolicySiteCount,
  type Subscription,
} from '@/api/billing';
import { calculateGeneratorPolicyQuote } from '@/api/checkout';
import { useEuRepContracts } from '@/api/eu-rep';
import {
  Buildings,
  Button,
  Cookie,
  FileText,
  GlobeHemisphereEast,
  Plus,
  Spinner,
} from '@/components/ui';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { useSiteScope } from '@/components/shared/site-scope';
import { type WebsiteSectionId } from '../account-sections';
import { AccountSection, AccountSectionFrame, subscriptionDaysLeft } from '../account-ui';
import { BillingHistoryTable } from '../BillingHistoryTable';
import {
  ServiceSubscriptionCard,
  type ServiceSubscriptionCardState,
} from '../ServiceSubscriptionCard';
import { buildSubscriptionPricing } from '../SubscriptionPricingMetadata';

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
  onAction?: () => void;
  actionLabel?: string;
};

export function SubscriptionsSection({
  onNavigate,
}: {
  onNavigate?: (section: WebsiteSectionId) => void;
}) {
  const t = useTranslations('account.siteSubscriptions');
  const tComingSoon = useTranslations('account.comingSoon');
  const tSubs = useTranslations('account.subscriptions');
  const tMembership = useTranslations('account.membershipPanel');
  const tDashboard = useTranslations('account.dashboard');
  const tStatus = useTranslations('account.status');
  const tDocuments = useTranslations('account.documents');
  const tNav = useTranslations('account.nav');
  const router = useRouter();

  const { activeSite, isLoading: sitesLoading } = useSiteScope();
  const subscriptions = useSubscriptions();
  const orders = useOrders();
  const contracts = useEuRepContracts();

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
                  router.push('/scan');
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
  const linkedContract = document?.euRepContractId
    ? (contracts.data ?? []).find((row) => row.id === document.euRepContractId)
    : undefined;
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
              pricePeriod: tMembership('products.policy.pricePeriod'),
            };
          })()
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
      notSubscribedLabel: t('notSubscribed'),
      comingSoonLabel: tNav('comingSoon'),
      description: config.description,
      muted: config.muted,
      onAction: config.onAction,
      actionLabel: config.actionLabel,
      equalHeight: true,
    };
  }

  function notifyWhenAvailable() {
    toast.success(
      tComingSoon('notifySuccess', {
        site: activeSite?.domain ?? tComingSoon('yourAccount'),
      })
    );
  }

  const policySubscription = subscriptionFor(document?.subscriptionId);
  const euRepSubscription = subscriptionFor(linkedContract?.subscriptionId);
  const policyOnTrial = policySubscription
    ? isPolicySubscriptionOnTrial(policySubscription)
    : false;

  const productCards: ProductCardConfig[] = [
    {
      id: 'privacyPolicy',
      icon: <FileText size={20} weight="fill" />,
      accent: 'var(--feature-indigo)',
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
    },
    {
      id: 'euRep',
      icon: <GlobeHemisphereEast size={20} weight="fill" />,
      accent: 'var(--feature-fuchsia)',
      title: tNav('euRep'),
      state: euRepSubscription ? 'active' : 'notSubscribed',
      statusBadge:
        euRepSubscription && euRepSubscription.status !== 'active' ? (
          <StatusPill tone={statusTone(euRepSubscription.status)}>
            {tStatus(euRepSubscription.status)}
          </StatusPill>
        ) : undefined,
      subscription: euRepSubscription,
      description: tDashboard('products.euRep.bodyInactive'),
      onAction: !euRepSubscription
        ? () => {
            onNavigate?.('euRep');
          }
        : undefined,
      actionLabel: !euRepSubscription ? t('enable') : undefined,
    },
    {
      id: 'cookieBanner',
      icon: <Cookie size={20} weight="fill" />,
      accent: 'var(--feature-yellow)',
      title: tNav('cookieBanner'),
      state: 'comingSoon',
      subscription: null,
      description: tDashboard('products.cookieBanner.body'),
      onAction: notifyWhenAvailable,
      actionLabel: t('notifyWhenAvailable'),
    },
    {
      id: 'imprint',
      icon: <Buildings size={20} weight="fill" />,
      accent: 'var(--feature-teal)',
      title: tNav('imprint'),
      state: 'comingSoon',
      subscription: null,
      description: tDashboard('products.imprint.body'),
      onAction: notifyWhenAvailable,
      actionLabel: t('notifyWhenAvailable'),
    },
  ];

  const subscribedIds = new Set(
    [policySubscription?.id, euRepSubscription?.id].filter(Boolean) as string[]
  );

  const payments = (orders.data ?? [])
    .filter((order) => (order.subscriptionId ? subscribedIds.has(order.subscriptionId) : false))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AccountSectionFrame
      title={tNav('overview')}
      content={
        <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
          <section
            aria-label={tDashboard('productsAriaLabel')}
            className="border-border divide-border grid divide-y border-b lg:grid-cols-2 lg:divide-x lg:divide-y-0 [&>*]:h-full [&>*:nth-child(2)]:lg:border-r-0 [&>*:nth-child(n+3)]:lg:border-t"
          >
            {productCards.map((card) => (
              <ServiceSubscriptionCard key={card.id} {...buildCardProps(card)} />
            ))}
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
