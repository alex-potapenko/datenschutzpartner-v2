import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RenewalCheckoutApp } from './_components/RenewalCheckoutApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.renewalCheckout');

  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default function RenewalCheckoutPage() {
  return <RenewalCheckoutApp />;
}
