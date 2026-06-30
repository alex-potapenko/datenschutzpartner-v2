import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <main className="mx-auto flex w-full max-w-2xl grow flex-col items-start justify-center gap-4 px-6 py-16">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <ThemeToggle />
      </div>
      <p className="text-lg">{t('intro')}</p>
      <Link
        href="/contacts"
        className="bg-key-500 text-key-950 hover:bg-key-600 rounded-lg px-4 py-2 font-semibold"
      >
        {t('cta')}
      </Link>
    </main>
  );
}
