import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AllSubscriptionsApp } from './_components/AllSubscriptionsApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.allSubscriptions');

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default function AllSubscriptionsPage() {
  return <AllSubscriptionsApp />;
}
