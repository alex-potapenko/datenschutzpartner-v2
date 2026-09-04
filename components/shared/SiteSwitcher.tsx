'use client';

import { useState, type ComponentType, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Buildings, Check, Cookie, Globe, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ListSearchInput } from './ListSearchInput';
import { ListSelectorTrigger } from './ListSelectorTrigger';
import {
  siteHasCookieBanner,
  siteHasImprint,
  useOptionalSiteScope,
  useSiteScope,
  type AccountSite,
} from './site-scope';

type SiteProductIconProps = {
  size?: number;
  weight?: 'fill' | 'regular';
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  title?: string;
  'aria-hidden'?: boolean;
};

type SiteProductId = 'cookieBanner' | 'imprint';

type SiteProductIconConfig = {
  id: SiteProductId;
  icon: ComponentType<SiteProductIconProps>;
  color: string;
  labelKey: 'productCookieBanner' | 'productImprint';
  isActive: (site: AccountSite) => boolean;
};

const SITE_PRODUCT_ICONS: SiteProductIconConfig[] = [
  {
    id: 'cookieBanner',
    icon: Cookie,
    color: 'var(--feature-yellow)',
    labelKey: 'productCookieBanner',
    isActive: (site) => siteHasCookieBanner(site),
  },
  {
    id: 'imprint',
    icon: Buildings,
    color: 'var(--feature-teal)',
    labelKey: 'productImprint',
    isActive: (site) => siteHasImprint(site),
  },
];

function SiteProductIcon({
  icon: Icon,
  color,
  label,
}: {
  icon: ComponentType<SiteProductIconProps>;
  color: string;
  label: string;
}) {
  return (
    <Icon
      size={14}
      weight="fill"
      className="shrink-0"
      style={{ color }}
      aria-label={label}
      title={label}
    />
  );
}

function SiteGlobeIcon() {
  return <Globe size={20} weight="regular" className="text-accent shrink-0" aria-hidden />;
}

function SidebarSiteList({
  sites,
  activeDomain,
  onSelect,
  emptyLabel,
  listAriaLabel,
}: {
  sites: AccountSite[];
  activeDomain: string;
  onSelect: (domain: string) => void;
  emptyLabel: string;
  listAriaLabel: string;
}) {
  const t = useTranslations('account.siteSwitcher');

  if (sites.length === 0) {
    return <p className="text-muted px-5 py-4 text-sm">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col" role="listbox" aria-label={listAriaLabel}>
      {sites.map((site) => {
        const isActive = site.domain === activeDomain;
        const activeProducts = SITE_PRODUCT_ICONS.filter((product) => product.isActive(site));

        return (
          <button
            key={site.domain}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => {
              onSelect(site.domain);
            }}
            className={cn(
              'flex min-h-12 w-full cursor-pointer items-center gap-2 px-5 text-left text-sm font-medium transition-colors',
              isActive
                ? 'bg-key-50 text-accent shadow-[inset_2px_0_0_0_var(--accent)]'
                : 'text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
            )}
          >
            <span className="min-w-0 flex-1 truncate">{site.domain}</span>
            {activeProducts.map((product) => {
              const ProductIcon = product.icon;
              return (
                <SiteProductIcon
                  key={product.id}
                  icon={ProductIcon}
                  color={product.color}
                  label={t(product.labelKey)}
                />
              );
            })}
            {isActive ? (
              <Check size={14} weight="bold" className="text-accent shrink-0" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function WebsiteSidebarSitePanel({ onSiteSelect }: { onSiteSelect?: () => void }) {
  const t = useTranslations('account.siteSwitcher');
  const tCommon = useTranslations('common');
  const { activeSite, sites, selectSite } = useSiteScope();
  const [query, setQuery] = useState('');

  if (!activeSite) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSites = sites.filter((site) =>
    normalizedQuery ? site.domain.toLowerCase().includes(normalizedQuery) : true
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border shrink-0 border-t px-5 pt-3.25 pb-3.25">
        <ListSearchInput
          value={query}
          onChange={setQuery}
          placeholder={tCommon('search')}
          ariaLabel={t('searchSites')}
          className="border-0 p-0"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <SidebarSiteList
          sites={filteredSites}
          activeDomain={activeSite.domain}
          onSelect={(domain) => {
            selectSite(domain);
            setQuery('');
            onSiteSelect?.();
          }}
          emptyLabel={t('noResults')}
          listAriaLabel={t('switchWebsite')}
        />
      </div>
    </div>
  );
}

/**
 * Website switcher trigger for the account sidebar.
 */
export function SiteSwitcher({
  className,
  variant = 'sidebar',
  isOpen,
  onOpenChange,
}: {
  className?: string;
  variant?: 'sidebar' | 'topbar';
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('account.siteSwitcher');
  const scope = useOptionalSiteScope();
  const isTopBar = variant === 'topbar';

  const activeSite = scope?.activeSite ?? null;
  const isLoading = scope?.isLoading ?? false;
  const label = activeSite?.domain ?? t('empty');

  const content = isLoading ? (
    <div
      className={cn('flex items-center', isTopBar ? 'px-4 py-1.5' : 'px-5 py-5')}
      aria-busy="true"
    >
      <Spinner aria-label={t('loading')} className="size-5" />
    </div>
  ) : activeSite ? (
    <ListSelectorTrigger
      label={activeSite.domain}
      ariaLabel={t('switchWebsite')}
      variant={variant}
      leadingIcon={!isTopBar ? <SiteGlobeIcon /> : undefined}
      isExpanded={isOpen}
      onPress={() => {
        onOpenChange(!isOpen);
      }}
    />
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

  return <div className={cn('shrink-0', className)}>{content}</div>;
}
