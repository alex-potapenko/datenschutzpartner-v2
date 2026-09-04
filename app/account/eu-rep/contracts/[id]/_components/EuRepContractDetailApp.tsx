'use client';

import { useMemo, useState, type Key } from 'react';
import { useTranslations } from 'next-intl';
import { useRequireSession } from '@/api/auth';
import { useSubscriptions } from '@/api/billing';
import { canDeleteEuRepEntity, useEuRepContract } from '@/api/eu-rep';
import { EU_REP_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { EuRepDeleteEntityAction } from '@/app/account/_components/EuRepDeleteEntityAction';
import { EuRepLegalEntityPanel } from '@/app/account/_components/sections/EuRepLegalEntityPanel';
import { MembershipPanel } from '@/app/account/_components/sections/MembershipPanel';
import {
  ACCOUNT_TAB_PANEL_CLASS,
  DataState,
  EmptyState,
  SECONDARY_TABS_INDICATOR_CLASS,
  SECONDARY_TABS_LIST_CLASS,
  SECONDARY_TABS_TAB_CLASS,
} from '@/app/account/_components/account-ui';
import { Spinner, Tabs, cn } from '@/components/ui';
import {
  PolicyDetailPageShell,
  PolicyDetailScreenHeader,
} from '@/components/shared/PolicyDetailLayout';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';

type ContractDetailTab = 'details' | 'subscription';

export function EuRepContractDetailApp({ contractId }: { contractId: string }) {
  const t = useTranslations('account.euRep.contract');
  const ts = useTranslations('account.status');
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('account');
  const returnTo = `/account/eu-rep/contracts/${contractId}`;
  const { isChecking } = useRequireSession(returnTo);
  const contractQuery = useEuRepContract(contractId);
  const subscriptions = useSubscriptions();
  const [tab, setTab] = useState<ContractDetailTab>('details');

  const contract = contractQuery.data;
  const subscription = useMemo(
    () =>
      contract
        ? (subscriptions.data ?? []).find((row) => row.id === contract.subscriptionId)
        : undefined,
    [contract, subscriptions.data]
  );
  const status = subscription?.status ?? contract?.status;
  const canDelete = canDeleteEuRepEntity(subscription);
  const detailTitle = tCommon('legalEntityDetails');

  if (isChecking) {
    return (
      <PolicyDetailPageShell
        backHref={EU_REP_ACCOUNT_HREF}
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
      backHref={EU_REP_ACCOUNT_HREF}
      backLabel={tCommon('back')}
      detailTitle={detailTitle}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <DataState
          isLoading={contractQuery.isLoading || subscriptions.isLoading}
          isError={contractQuery.isError}
          onRetry={() => {
            void contractQuery.refetch();
          }}
        >
          {contract ? (
            <>
              <Tabs
                variant="secondary"
                selectedKey={tab}
                onSelectionChange={(key: Key) => {
                  setTab(key as ContractDetailTab);
                }}
                className="flex min-h-0 w-full flex-1 flex-col gap-0"
              >
                <PolicyDetailScreenHeader
                  action={
                    canDelete ? (
                      <EuRepDeleteEntityAction
                        contractId={contract.id}
                        entityName={contract.legalEntity}
                      />
                    ) : undefined
                  }
                  below={
                    <Tabs.ListContainer className="overflow-x-auto">
                      <Tabs.List
                        aria-label={t('tabsAriaLabel')}
                        className={SECONDARY_TABS_LIST_CLASS}
                      >
                        <Tabs.Tab id="details" className={SECONDARY_TABS_TAB_CLASS}>
                          <span className="text-base font-medium whitespace-nowrap">
                            {t('tabs.details')}
                          </span>
                          <Tabs.Indicator className={SECONDARY_TABS_INDICATOR_CLASS} />
                        </Tabs.Tab>
                        <Tabs.Tab id="subscription" className={SECONDARY_TABS_TAB_CLASS}>
                          <span className="text-base font-medium whitespace-nowrap">
                            {t('tabs.subscription')}
                          </span>
                          <Tabs.Indicator className={SECONDARY_TABS_INDICATOR_CLASS} />
                        </Tabs.Tab>
                      </Tabs.List>
                    </Tabs.ListContainer>
                  }
                >
                  <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
                    {contract.legalEntity || t('title')}
                  </h1>
                  {status ? <StatusPill tone={statusTone(status)}>{ts(status)}</StatusPill> : null}
                </PolicyDetailScreenHeader>

                <Tabs.Panel
                  id="details"
                  className={cn(ACCOUNT_TAB_PANEL_CLASS, 'flex min-h-0 flex-1 flex-col')}
                >
                  <EuRepLegalEntityPanel contract={contract} />
                </Tabs.Panel>

                <Tabs.Panel
                  id="subscription"
                  className={cn(ACCOUNT_TAB_PANEL_CLASS, 'flex min-h-0 flex-1 flex-col')}
                >
                  <MembershipPanel productType="euRep" subscriptionId={contract.subscriptionId} />
                </Tabs.Panel>
              </Tabs>
            </>
          ) : (
            <EmptyState message={t('notFound')} />
          )}
        </DataState>
      </div>
    </PolicyDetailPageShell>
  );
}
