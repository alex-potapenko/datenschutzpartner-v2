import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { VerifyEmailApp } from './_components/VerifyEmailApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('verifyEmail');

  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default function VerifyEmailPage() {
  return <VerifyEmailApp />;
}
