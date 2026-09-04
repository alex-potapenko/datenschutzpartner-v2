'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useVerifyEmail } from '@/api/auth';
import { Spinner } from '@/components/ui';
import { Logo } from '@/components/shared/Logo';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { emptyEuRepState, readWizardState, writeWizardState } from '@/app/result/wizard-state';

function resultUrlForDomain(domain: string) {
  const href = domain.startsWith('http') ? domain : `https://${domain}`;
  return `/result?url=${encodeURIComponent(href)}`;
}

function VerifyEmailContent() {
  const t = useTranslations('verifyEmail');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const verify = useVerifyEmail();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (!token) return;
    started.current = true;

    verify.mutate(
      { token },
      {
        onSuccess: (data) => {
          const existing = readWizardState();
          const domain = data.domain ?? existing?.domain;

          if (existing) {
            writeWizardState({
              ...existing,
              step: 'confirm',
              confirmReady: true,
              domain: domain ?? existing.domain,
              checkoutPhase: 'confirm',
              checkoutDocumentId: data.documentId ?? existing.checkoutDocumentId,
            });
          } else if (domain) {
            writeWizardState({
              step: 'confirm',
              scanDone: true,
              confirmReady: true,
              euRep: { ...emptyEuRepState(), done: true },
              visitedSteps: ['scanning', 'questionnaire', 'confirm'],
              domain,
              checkoutPhase: 'confirm',
              checkoutDocumentId: data.documentId,
            });
          }

          toast.success(t('success'));
          router.replace(
            data.redirectTo ??
              (domain ? resultUrlForDomain(domain) : '/account?accountScope=euRep&section=euRep')
          );
        },
        onError: () => {
          toast.error(t('failed'));
        },
      }
    );
  }, [router, t, token, verify]);

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          aria-label={tc('home')}
          className="mb-8 cursor-pointer self-center text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          <Logo inverse={false} />
        </Link>

        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
          {!token ? (
            <p className="text-foreground text-sm leading-relaxed">{t('missingToken')}</p>
          ) : verify.isError ? (
            <p className="text-foreground text-sm leading-relaxed">{t('failedBody')}</p>
          ) : (
            <p className="text-foreground text-sm leading-relaxed">{t('processing')}</p>
          )}
        </div>

        {token && !verify.isError ? (
          <div className="flex justify-center py-4">
            <Spinner aria-label={t('processing')} />
          </div>
        ) : null}

        <NavigationLink href="/login" chevron="left" className="self-center">
          {t('backToLogin')}
        </NavigationLink>
      </div>
    </main>
  );
}

export function VerifyEmailApp() {
  const t = useTranslations('verifyEmail');

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner aria-label={t('processing')} />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
