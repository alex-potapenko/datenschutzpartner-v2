'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/components/ui';
import { AFFILIATE_TAB_ACCENT, AFFILIATE_TAB_ICON } from './affiliate-tab-icons';
import { useAffiliateSidebarNav } from './useAffiliateSidebarNav';
import {
  AFFILIATE_PARTNER_DEFAULT_TAB as DEFAULT_TAB,
  affiliateTabIds,
  parseAffiliateTab,
  type ServiceTabId,
} from './sections/service-tabs';

export function AffiliateServiceSidebarNav() {
  const t = useTranslations('account.serviceTabs');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { visible, isPartner } = useAffiliateSidebarNav();
  const tab = parseAffiliateTab(searchParams.get('tab'), isPartner);

  if (!visible) return null;
  const accent = AFFILIATE_TAB_ACCENT;

  function selectTab(next: ServiceTabId) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_TAB) {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', next);
    }
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-16">
      <div className="flex flex-col">
        {affiliateTabIds(isPartner).map((id) => {
          const isActive = tab === id;
          const Icon = AFFILIATE_TAB_ICON[id];

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                selectTab(id);
              }}
              className={cn(
                'flex min-h-12 w-full cursor-pointer items-center gap-3 px-5 text-left text-sm font-medium transition-[color,background-color,box-shadow] duration-200',
                isActive
                  ? 'text-foreground'
                  : 'text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
              )}
              style={
                isActive
                  ? {
                      background: `color-mix(in oklab, ${accent} 10%, transparent)`,
                      boxShadow: `inset 2px 0 0 0 ${accent}`,
                    }
                  : undefined
              }
            >
              {Icon ? (
                <Icon
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                  className="shrink-0"
                  style={isActive ? { color: accent } : undefined}
                  aria-hidden
                />
              ) : null}
              <span className="min-w-0 flex-1 truncate">{t(id)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
