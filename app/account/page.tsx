import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AccountApp } from './_components/AccountApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    robots: { index: false, follow: false },
  };
}

export default function AccountPage() {
  return <AccountApp />;
}
