'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useRequireSession } from '@/api/auth';
import { Spinner } from '@/components/ui';
import { AccountShell } from './AccountShell';

export function AccountApp() {
  const t = useTranslations('account');
  const { isChecking } = useRequireSession();

  if (isChecking) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center">
        <Spinner aria-label={t('loading')} />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-1 items-center justify-center">
          <Spinner aria-label={t('loading')} />
        </div>
      }
    >
      <AccountShell />
    </Suspense>
  );
}
