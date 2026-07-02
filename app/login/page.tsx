import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CaretLeft } from '@/components/ui';
import { Logo } from '@/components/shared/Logo';
import { LoginForm } from './_components/LoginForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('login');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function LoginPage() {
  const tc = await getTranslations('common');

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          aria-label={tc('home')}
          className="mb-8 self-center text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          <Logo height={28} />
        </Link>
        <LoginForm />
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 self-center text-base font-normal transition-colors hover:text-[var(--link-hover)]"
          style={{ color: 'var(--accent)' }}
        >
          <CaretLeft size={16} aria-hidden />
          {tc('backHome')}
        </Link>
      </div>
    </main>
  );
}
