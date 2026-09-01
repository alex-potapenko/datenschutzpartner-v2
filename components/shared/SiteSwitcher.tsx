'use client';

import { useTranslations } from 'next-intl';
import {
  Check,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  Globe,
  Spinner,
} from '@/components/ui';
import { useEuRepContracts } from '@/api/eu-rep';
import { cn } from '@/lib/utils';
import { ListSelectorTrigger } from './ListSelectorTrigger';
import { siteHasEuRep, siteHasPolicy, useOptionalSiteScope, type AccountSite } from './site-scope';

function siteProductSummary(
  site: AccountSite,
  contracts: ReturnType<typeof useEuRepContracts>['data'],
  t: ReturnType<typeof useTranslations>
): string {
  const rows = contracts ?? [];
  const products: string[] = [];
  if (siteHasPolicy(site)) products.push(t('productPolicy'));
  if (siteHasEuRep(site, rows)) products.push(t('productEuRep'));
  return products.length > 0 ? products.join(' · ') : t('emptyProducts');
}

function SiteGlobeIcon() {
  return <Globe size={20} weight="regular" className="text-accent shrink-0" aria-hidden />;
}

/**
 * Website switcher for the account area — in the sidebar on desktop and mobile.
 */
export function SiteSwitcher({
  className,
  variant = 'sidebar',
}: {
  className?: string;
  variant?: 'sidebar' | 'topbar';
}) {
  const t = useTranslations('account.siteSwitcher');
  const scope = useOptionalSiteScope();
  const contracts = useEuRepContracts();
  const isTopBar = variant === 'topbar';

  const activeSite = scope?.activeSite ?? null;
  const isLoading = scope?.isLoading ?? false;
  const label = activeSite?.domain ?? t('empty');
  const contractList = contracts.data ?? [];

  const dropdownItems = (scope?.sites ?? []).map((site) => (
    <DropdownItem
      key={site.domain}
      id={site.domain}
      textValue={site.domain}
      className="px-3 py-2.5"
    >
      <span className="flex w-full min-w-0 items-center gap-3">
        {!isTopBar ? <SiteGlobeIcon /> : null}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate text-sm font-semibold">{site.domain}</span>
          <span className="text-muted truncate text-xs">
            {siteProductSummary(site, contractList, t)}
          </span>
        </span>
        {site.domain === activeSite?.domain ? (
          <Check size={14} weight="bold" className="text-accent shrink-0" aria-hidden />
        ) : null}
      </span>
    </DropdownItem>
  ));

  const content = isLoading ? (
    <div
      className={cn('flex items-center', isTopBar ? 'px-4 py-1.5' : 'px-5 py-5')}
      aria-busy="true"
    >
      <Spinner aria-label={t('loading')} className="size-5" />
    </div>
  ) : activeSite ? (
    <DropdownRoot>
      <ListSelectorTrigger
        label={activeSite.domain}
        ariaLabel={t('switchWebsite')}
        variant={variant}
        leadingIcon={!isTopBar ? <SiteGlobeIcon /> : undefined}
      />
      <DropdownPopover placement="bottom start" className={isTopBar ? 'mt-2 w-72' : 'mt-1 w-72'}>
        <DropdownMenu
          aria-label={t('switchWebsite')}
          selectionMode="single"
          selectedKeys={new Set([activeSite.domain])}
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];
            if (next) scope?.selectSite(String(next));
          }}
        >
          {dropdownItems}
        </DropdownMenu>
      </DropdownPopover>
    </DropdownRoot>
  ) : (
    <div
      className={cn(
        'truncate font-semibold',
        isTopBar
          ? 'font-display px-4 py-1.5 text-sm font-medium text-white/75'
          : 'text-muted px-5 py-5 font-sans text-base'
      )}
    >
      {label}
    </div>
  );

  if (isTopBar) {
    return <div className={cn('flex min-w-0 items-center', className)}>{content}</div>;
  }

  return <div className={className}>{content}</div>;
}
