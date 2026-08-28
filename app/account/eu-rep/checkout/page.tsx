import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EuRepCheckoutApp } from './_components/EuRepCheckoutApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.euRepCheckout');

  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default function EuRepCheckoutPage() {
  return <EuRepCheckoutApp />;
}
