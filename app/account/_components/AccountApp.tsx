'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from '@/api/auth';
import { Spinner } from '@/components/ui';
import { AccountShell } from './AccountShell';

export function AccountApp() {
  const t = useTranslations('account');
  const router = useRouter();
  const session = useSession();

  const isAuthenticated = Boolean(session.data?.email);

  useEffect(() => {
    if (!session.isLoading && !session.isError && !isAuthenticated) {
      router.replace('/login');
    }
  }, [session.isLoading, session.isError, isAuthenticated, router]);

  if (session.isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center">
        <Spinner aria-label={t('loading')} />
      </div>
    );
  }

  return <AccountShell />;
}
