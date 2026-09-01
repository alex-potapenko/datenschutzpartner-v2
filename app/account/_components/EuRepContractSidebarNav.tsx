'use client';

import { useTranslations } from 'next-intl';
import { useEuRepScope } from '@/components/shared/eu-rep-scope';
import { Spinner, cn } from '@/components/ui';

export function EuRepContractSidebarNav() {
  const t = useTranslations('account.contractSwitcher');
  const { contracts, activeContract, isLoading, selectContract } = useEuRepScope();

  if (isLoading) {
    return (
      <div className="flex min-h-24 items-center px-8 py-6" aria-busy="true">
        <Spinner aria-label={t('loading')} className="size-5" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-10 pb-2">
        <p className="font-display text-muted min-w-0 text-xs font-semibold tracking-wide">
          {t('listTitle')}
        </p>
      </div>
      <div className="flex flex-col">
        {contracts.length === 0 ? (
          <p className="text-muted px-5 py-4 text-sm">{t('empty')}</p>
        ) : (
          contracts.map((contract) => {
            const isActive = contract.id === activeContract?.id;

            return (
              <button
                key={contract.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  selectContract(contract.id);
                }}
                className={cn(
                  'flex min-h-12 w-full cursor-pointer items-center px-5 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-key-50 text-accent shadow-[inset_2px_0_0_0_var(--accent)]'
                    : 'text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
                )}
              >
                <span className="min-w-0 flex-1 truncate">{contract.legalEntity}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
