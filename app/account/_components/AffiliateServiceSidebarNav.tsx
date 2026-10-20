'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAffiliateDashboard } from '@/api/affiliate';
import { cn } from '@/components/ui';
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
  const dashboard = useAffiliateDashboard();
  const isPartner = Boolean(dashboard.data);
  const tab = parseAffiliateTab(searchParams.get('tab'), isPartner);
  const accent = 'var(--accent)';

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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-6">
      <div className="flex flex-col">
        {affiliateTabIds(isPartner).map((id) => {
          const isActive = tab === id;

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
              <span className="min-w-0 flex-1 truncate">{t(id)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
