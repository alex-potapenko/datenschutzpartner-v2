'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSubscriptions, isEuRepSubscriptionOnTrial } from '@/api/billing';
import { ListSearchInput } from '@/components/shared/ListSearchInput';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';
import { useEuRepScope } from '@/components/shared/eu-rep-scope';
import { Spinner, cn } from '@/components/ui';

export function EuRepContractSidebarNav() {
  const t = useTranslations('account.contractSwitcher');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const ts = useTranslations('account.status');
  const subscriptions = useSubscriptions();
  const { contracts, activeContract, isLoading, selectContract } = useEuRepScope();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const filteredContracts = useMemo(
    () =>
      contracts.filter((contract) =>
        normalizedQuery ? contract.legalEntity.toLowerCase().includes(normalizedQuery) : true
      ),
    [contracts, normalizedQuery]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-24 items-center px-8 py-6" aria-busy="true">
        <Spinner aria-label={t('loading')} className="size-5" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-8 pb-3">
        <ListSearchInput
          value={query}
          onChange={setQuery}
          placeholder={tCommon('search')}
          ariaLabel={t('searchEntities')}
          className="border-0 p-0"
        />
      </div>
      <div className="flex flex-col">
        {contracts.length === 0 ? (
          <p className="text-muted px-5 py-4 text-sm">{t('empty')}</p>
        ) : filteredContracts.length === 0 ? (
          <p className="text-muted px-5 py-4 text-sm">{t('noResults')}</p>
        ) : (
          filteredContracts.map((contract) => {
            const isActive = contract.id === activeContract?.id;
            const subscription = (subscriptions.data ?? []).find(
              (row) => row.id === contract.subscriptionId
            );
            const onTrial = subscription ? isEuRepSubscriptionOnTrial(subscription) : false;
            const showStatus =
              !onTrial &&
              (subscription?.status === 'cancelled' || subscription?.status === 'expired');

            return (
              <button
                key={contract.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  selectContract(contract.id);
                }}
                className={cn(
                  'flex min-h-12 w-full cursor-pointer items-center gap-2 px-5 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-key-50 text-accent shadow-[inset_2px_0_0_0_var(--accent)]'
                    : 'text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
                )}
              >
                <span className="min-w-0 flex-1 truncate">{contract.legalEntity}</span>
                {onTrial ? (
                  <MetaBadge kind="trial" className="shrink-0">
                    {tAccount('nav.trial')}
                  </MetaBadge>
                ) : showStatus && subscription ? (
                  <StatusPill tone={statusTone(subscription.status)}>
                    {ts(subscription.status)}
                  </StatusPill>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
