import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GeneratorCheckoutApp } from './_components/GeneratorCheckoutApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.generatorCheckout');

  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default function GeneratorCheckoutPage() {
  return <GeneratorCheckoutApp />;
}
