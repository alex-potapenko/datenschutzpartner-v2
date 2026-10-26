'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authKeys, consumeMagicLinkLogin } from '@/api/auth';
import { ScanLoader } from '@/components/shared/ScanLoader';
import { NavigationLink } from '@/components/shared/NavigationLink';

type VerifyState = 'loading' | 'error';

function LoginMagicLinkVerifyContent() {
  const t = useTranslations('login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const token = searchParams.get('token')?.trim() ?? '';
  const returnTo = searchParams.get('returnTo') ?? '/account';
  const [state, setState] = useState<VerifyState>('loading');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void consumeMagicLinkLogin(token)
      .then(async (data) => {
        if (cancelled) return;
        if (!data.token) {
          setState('error');
          toast.error(t('magicLinkInvalid'));
          return;
        }
        await queryClient.invalidateQueries({ queryKey: authKeys.session });
        toast.success(t('success'));
        router.replace(returnTo);
      })
      .catch(() => {
        if (cancelled) return;
        setState('error');
        toast.error(t('magicLinkInvalid'));
      });

    return () => {
      cancelled = true;
    };
  }, [queryClient, returnTo, router, t, token]);

  if (!token) {
    return (
      <>
        <h1 className="text-foreground mb-4 text-center text-2xl font-bold sm:text-3xl">
          {t('title')}
        </h1>
        <p className="text-muted text-center text-sm">{t('magicLinkMissing')}</p>
        <NavigationLink href="/login" className="mx-auto mt-4">
          {t('magicLinkBackToLogin')}
        </NavigationLink>
      </>
    );
  }

  if (state === 'error') {
    return (
      <>
        <h1 className="text-foreground mb-4 text-center text-2xl font-bold sm:text-3xl">
          {t('title')}
        </h1>
        <p className="text-muted text-center text-sm">{t('magicLinkInvalid')}</p>
        <NavigationLink href="/login" className="mx-auto mt-4">
          {t('magicLinkBackToLogin')}
        </NavigationLink>
      </>
    );
  }

  return (
    <>
      <h1 className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl">
        {t('title')}
      </h1>
      <ScanLoader
        layout="center"
        label={t('magicLinkVerifying')}
        statusAriaLabel={t('magicLinkVerifying')}
        className="py-8"
      />
    </>
  );
}

export function LoginMagicLinkVerify() {
  return (
    <Suspense fallback={null}>
      <LoginMagicLinkVerifyContent />
    </Suspense>
  );
}
