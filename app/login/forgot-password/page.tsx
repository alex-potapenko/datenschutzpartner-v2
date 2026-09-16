import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('forgotPassword');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function ForgotPasswordPage() {
  return null;
}
