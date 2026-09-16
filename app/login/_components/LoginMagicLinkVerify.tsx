'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMagicLinkLogin } from '@/api/auth';
import { Spinner } from '@/components/ui';
import { Logo } from '@/components/shared/Logo';
import { NavigationLink } from '@/components/shared/NavigationLink';

function LoginMagicLinkVerifyContent() {
  const t = useTranslations('login');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const magicLink = useMagicLinkLogin();
  const started = useRef(false);
  const returnTo = searchParams.get('returnTo') ?? '/account';

  useEffect(() => {
    if (started.current) return;
    if (!token) return;
    started.current = true;

    magicLink.mutate(
      { token },
      {
        onSuccess: () => {
          toast.success(t('success'));
          router.replace(returnTo);
        },
        onError: () => {
          toast.error(t('magicLinkInvalid'));
        },
      }
    );
  }, [magicLink, returnTo, router, t, token]);

  if (!token) {
    return (
      <>
        <div className="flex flex-col items-center">
          <Link
            href="/"
            aria-label={tc('home')}
            className="mb-4 cursor-pointer text-[var(--accent)] transition-opacity hover:opacity-80"
          >
            <Logo inverse={false} />
          </Link>
          <h1 className="text-foreground mb-4 text-center text-2xl font-bold sm:text-3xl">
            {t('title')}
          </h1>
        </div>
        <p className="text-muted text-center text-sm">{t('magicLinkMissing')}</p>
        <NavigationLink href="/login" className="mx-auto mt-4">
          {t('magicLinkBackToLogin')}
        </NavigationLink>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center">
        <Link
          href="/"
          aria-label={tc('home')}
          className="mb-4 cursor-pointer text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          <Logo inverse={false} />
        </Link>
        <h1 className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl">
          {t('title')}
        </h1>
      </div>
      <div className="flex flex-col items-center gap-3 py-8">
        <Spinner size="lg" aria-hidden />
        <p className="text-muted text-center text-sm">{t('magicLinkVerifying')}</p>
      </div>
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
