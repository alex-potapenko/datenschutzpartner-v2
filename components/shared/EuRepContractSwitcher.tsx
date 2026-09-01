'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { EuRepContract } from '@/api/eu-rep';
import {
  Button,
  CaretUpDown,
  Check,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  DropdownTrigger,
  GlobeHemisphereEast,
  Plus,
  Spinner,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useOptionalEuRepScope } from './eu-rep-scope';

const ADD_EU_REP_HREF = '/account/eu-rep/checkout';

function contractSummary(contract: EuRepContract, t: ReturnType<typeof useTranslations>): string {
  if (contract.website) return contract.website;
  if (contract.linkedDocumentIds.length > 0) {
    return t('linkedPolicies', { count: contract.linkedDocumentIds.length });
  }
  return t('standalone');
}

/**
 * Legal-entity switcher for the EU Representation account section — independent
 * of the website switcher because contracts may exist without a hosted policy.
 */
export function EuRepContractSwitcher({
  className,
  variant = 'sidebar',
}: {
  className?: string;
  variant?: 'sidebar' | 'topbar';
}) {
  const t = useTranslations('account.contractSwitcher');
  const router = useRouter();
  const scope = useOptionalEuRepScope();
  const isTopBar = variant === 'topbar';

  const activeContract = scope?.activeContract ?? null;
  const isLoading = scope?.isLoading ?? false;
  const label = activeContract?.legalEntity ?? t('empty');

  const addContractButton = scope ? (
    <Button
      variant="outline"
      size="sm"
      isIconOnly
      aria-label={t('addContract')}
      className={cn(
        'size-9 shrink-0 rounded-full',
        isTopBar && 'border-white/20 text-white hover:bg-white/10'
      )}
      onPress={() => {
        router.push(ADD_EU_REP_HREF);
      }}
    >
      <Plus size={16} weight="bold" aria-hidden />
    </Button>
  ) : null;

  const topBarTriggerClass =
    'font-display flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-transparent py-1 pr-3 pl-3 text-sm font-medium text-white transition-colors outline-none hover:bg-white/10';

  const sidebarTriggerClass =
    'hover:bg-key-50 -mx-2 flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-2 py-1.5 text-left outline-none transition-colors';

  const trigger = activeContract ? (
    <DropdownRoot>
      <DropdownTrigger
        aria-label={t('switchContract')}
        className={isTopBar ? topBarTriggerClass : sidebarTriggerClass}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-semibold',
            isTopBar ? 'font-display text-sm font-medium' : 'text-foreground font-sans text-base'
          )}
        >
          {activeContract.legalEntity}
        </span>
        <CaretUpDown
          size={isTopBar ? 14 : 18}
          className={cn('shrink-0', isTopBar ? 'text-white/70' : 'text-muted')}
          aria-hidden
        />
      </DropdownTrigger>
      <DropdownPopover placement="bottom start" className={isTopBar ? 'mt-2 w-72' : 'mt-1 w-72'}>
        <DropdownMenu
          aria-label={t('switchContract')}
          selectionMode="single"
          selectedKeys={new Set([activeContract.id])}
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];
            if (next) scope?.selectContract(String(next));
          }}
        >
          {(scope?.contracts ?? []).map((contract) => (
            <DropdownItem
              key={contract.id}
              id={contract.id}
              textValue={contract.legalEntity}
              className="px-3 py-2.5"
            >
              <span className="flex w-full min-w-0 items-center gap-3">
                {!isTopBar ? (
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                      color: 'var(--accent)',
                    }}
                    aria-hidden
                  >
                    <GlobeHemisphereEast size={16} weight="fill" />
                  </span>
                ) : null}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-foreground truncate text-sm font-semibold">
                    {contract.legalEntity}
                  </span>
                  <span className="text-muted truncate text-xs">
                    {contractSummary(contract, t)}
                  </span>
                </span>
                {contract.id === activeContract.id ? (
                  <Check size={14} weight="bold" className="text-accent shrink-0" aria-hidden />
                ) : null}
              </span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </DropdownPopover>
    </DropdownRoot>
  ) : (
    <span
      className={cn(
        'min-w-0 flex-1 truncate font-semibold',
        isTopBar
          ? 'font-display text-sm font-medium text-white/75'
          : 'text-muted font-sans text-base'
      )}
    >
      {label}
    </span>
  );

  if (isTopBar) {
    return (
      <div className={cn('flex min-w-0 items-center gap-2', className)}>
        {trigger}
        {addContractButton}
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-24 items-center justify-between gap-3 px-6 py-6', className)}>
      {isLoading ? (
        <span className="flex items-center gap-3">
          <Spinner aria-label={t('loading')} className="size-5" />
        </span>
      ) : (
        trigger
      )}
      {addContractButton}
    </div>
  );
}
