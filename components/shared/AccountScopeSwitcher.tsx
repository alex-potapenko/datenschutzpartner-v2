'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  EU_REP_SECTION_ID,
  isEuRepAccountScope,
  normalizeAccountScope,
  normalizeWebsiteSection,
} from '@/app/account/_components/account-sections';
import { cn } from '@/components/ui';

/** Top-bar destinations — My Websites, EU Rep, Affiliate (not sidebar). */
export const ACCOUNT_TOP_NAV_IDS = ['websites', 'euRep', 'affiliate'] as const;

export type AccountTopNavId = (typeof ACCOUNT_TOP_NAV_IDS)[number];

const TOP_NAV_LINK_CLASS =
  'font-display cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold whitespace-nowrap transition-colors';

function readActiveTopNav(
  sectionParam: string | null,
  accountScope: ReturnType<typeof normalizeAccountScope>
): AccountTopNavId {
  if (normalizeWebsiteSection(sectionParam) === 'affiliate') {
    return 'affiliate';
  }
  if (isEuRepAccountScope(accountScope)) {
    return 'euRep';
  }
  return 'websites';
}

/**
 * Account top-bar area links — My Websites, EU Representation, Affiliate Program.
 */
export function AccountScopeSwitcher({ className }: { className?: string }) {
  const tScope = useTranslations('account.scope');
  const tNav = useTranslations('account.nav');
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountScope = normalizeAccountScope(searchParams.get('accountScope'));
  const activeTopNav = readActiveTopNav(searchParams.get('section'), accountScope);

  function switchTopNav(next: AccountTopNavId) {
    if (next === activeTopNav) return;

    const params = new URLSearchParams(searchParams.toString());

    if (next === 'euRep') {
      params.set('accountScope', 'euRep');
      params.set('section', EU_REP_SECTION_ID);
    } else if (next === 'affiliate') {
      params.set('accountScope', 'websites');
      params.set('section', 'affiliate');
      params.delete('contract');
    } else {
      params.set('accountScope', 'websites');
      const section = params.get('section');
      if (section === EU_REP_SECTION_ID || section === 'affiliate') {
        params.set('section', 'overview');
      }
      params.delete('contract');
    }

    router.replace(`/account?${params.toString()}`, { scroll: false });
  }

  function labelFor(id: AccountTopNavId) {
    if (id === 'affiliate') {
      return tNav('affiliate');
    }
    return tScope(id);
  }

  return (
    <nav className={cn('flex items-center gap-5', className)} aria-label={tScope('ariaLabel')}>
      {ACCOUNT_TOP_NAV_IDS.map((id) => {
        const isActive = activeTopNav === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              switchTopNav(id);
            }}
            className={cn(
              TOP_NAV_LINK_CLASS,
              isActive ? 'text-white' : 'text-white/55 hover:text-white'
            )}
          >
            {labelFor(id)}
          </button>
        );
      })}
    </nav>
  );
}

export function useAccountScope() {
  const searchParams = useSearchParams();
  return normalizeAccountScope(searchParams.get('accountScope'));
}

export { isEuRepAccountScope };
