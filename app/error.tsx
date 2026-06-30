'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    // Promotion step: report to Sentry here (see AGENTS.md → Handover).
    console.error(error);
  }, [error]);

  return (
    <main className="flex grow flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-2xl font-bold">{t('error')}</h1>
      <Button onPress={reset}>{t('retry')}</Button>
    </main>
  );
}
