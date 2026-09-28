import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PayrexxSimulationApp } from './_components/PayrexxSimulationApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('checkout.payrexx');

  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

/** POC STUB (Payrexx) — simulated hosted payment page; delete this route in production. */
export default function PayrexxSimulationPage() {
  return <PayrexxSimulationApp />;
}
