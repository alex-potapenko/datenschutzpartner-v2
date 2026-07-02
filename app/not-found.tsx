import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <main className="flex grow flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-xl font-bold">{t('notFound')}</h1>
      <Link href="/" className="text-key-700 font-normal hover:underline">
        {t('backHome')}
      </Link>
    </main>
  );
}
