'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  isEuRepAccountScope,
  normalizeAccountScope,
} from '@/app/account/_components/account-sections';
import { cn } from '@/components/ui';

type AccountScope = 'websites' | 'euRep';

const SCOPE_LINK_CLASS =
  'font-display cursor-pointer border-0 bg-transparent p-0 text-sm font-medium whitespace-nowrap transition-colors';

/**
 * Account top-bar scope links — same pattern as Insights / About / Contact on
 * the public landing {@link TopBar}.
 */
export function AccountScopeSwitcher({ className }: { className?: string }) {
  const t = useTranslations('account.scope');
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeScope: AccountScope = normalizeAccountScope(searchParams.get('accountScope'));

  function switchScope(next: AccountScope) {
    if (next === activeScope) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('accountScope', next);

    if (next === 'euRep') {
      params.set('section', 'euRep');
    } else {
      if (params.get('section') === 'euRep') {
        params.set('section', 'overview');
      }
      params.delete('contract');
    }

    router.replace(`/account?${params.toString()}`, { scroll: false });
  }

  return (
    <nav className={cn('flex items-center gap-5', className)} aria-label={t('ariaLabel')}>
      {(['websites', 'euRep'] as const).map((scope) => {
        const isActive = activeScope === scope;

        return (
          <button
            key={scope}
            type="button"
            onClick={() => {
              switchScope(scope);
            }}
            className={cn(
              SCOPE_LINK_CLASS,
              isActive ? 'text-white' : 'text-white/55 hover:text-white'
            )}
          >
            {t(scope)}
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
