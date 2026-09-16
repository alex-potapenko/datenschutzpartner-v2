import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('login');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function LoginPage() {
  return null;
}
