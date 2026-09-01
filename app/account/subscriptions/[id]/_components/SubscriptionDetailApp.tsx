'use client';

import { useTranslations } from 'next-intl';
import { useRequireSession } from '@/api/auth';
import { useSubscription, useSubscriptions } from '@/api/billing';
import { ALL_SUBSCRIPTIONS_ACCOUNT_HREF } from '@/lib/account-routes';
import { MembershipPanel } from '@/app/account/_components/sections/MembershipPanel';
import { DataState, EmptyState } from '@/app/account/_components/account-ui';
import { Spinner } from '@/components/ui';
import {
  PolicyDetailPageShell,
  PolicyDetailScreenHeader,
} from '@/components/shared/PolicyDetailLayout';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';

export function SubscriptionDetailApp({ subscriptionId }: { subscriptionId: string }) {
  const t = useTranslations('account.membershipPanel');
  const ts = useTranslations('account.status');
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('account');
  const returnTo = `/account/subscriptions/${subscriptionId}`;
  const { isChecking } = useRequireSession(returnTo);
  const listQuery = useSubscriptions();
  const subscriptionQuery = useSubscription(subscriptionId);
  const fromList = listQuery.data?.find((row) => row.id === subscriptionId);
  const subscription =
    subscriptionQuery.data?.id === subscriptionId ? subscriptionQuery.data : fromList;
  const isLoading = !subscription && (subscriptionQuery.isPending || listQuery.isPending);
  const isError = !subscription && (subscriptionQuery.isError || listQuery.isError) && !isLoading;
  const backHref = ALL_SUBSCRIPTIONS_ACCOUNT_HREF;
  const detailTitle = tCommon('subscriptionDetails');

  if (isChecking) {
    return (
      <PolicyDetailPageShell
        backHref={backHref}
        backLabel={tCommon('back')}
        detailTitle={detailTitle}
      >
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </PolicyDetailPageShell>
    );
  }

  return (
    <PolicyDetailPageShell
      backHref={backHref}
      backLabel={tCommon('back')}
      detailTitle={detailTitle}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <DataState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => {
            void listQuery.refetch();
            void subscriptionQuery.refetch();
          }}
        >
          {subscription ? (
            <>
              <PolicyDetailScreenHeader>
                <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
                  {t(`products.${subscription.productType}.planTitle`)}
                </h1>
                <StatusPill tone={statusTone(subscription.status)}>
                  {ts(subscription.status)}
                </StatusPill>
              </PolicyDetailScreenHeader>

              <MembershipPanel
                productType={subscription.productType}
                subscriptionId={subscription.id}
              />
            </>
          ) : (
            <EmptyState message={t('notFound')} />
          )}
        </DataState>
      </div>
    </PolicyDetailPageShell>
  );
}
