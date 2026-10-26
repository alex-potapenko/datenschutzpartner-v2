import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Logo } from '@/components/shared/Logo';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { ScanLoader } from '@/components/shared/ScanLoader';
import { SetPasswordApp } from './_components/SetPasswordApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setPassword');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function SetPasswordPage() {
  const tc = await getTranslations('common');
  const t = await getTranslations('setPassword');

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          aria-label={tc('home')}
          className="mb-2 cursor-pointer self-center text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          <Logo inverse={false} />
        </Link>
        <Suspense
          fallback={
            <ScanLoader
              layout="center"
              label={t('validating')}
              statusAriaLabel={t('validating')}
              className="py-8"
            />
          }
        >
          <SetPasswordApp />
        </Suspense>
        <NavigationLink href="/login" chevron="left" className="self-center">
          {tc('backHome')}
        </NavigationLink>
      </div>
    </main>
  );
}
