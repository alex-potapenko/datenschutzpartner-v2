import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubscriptionDetailApp } from './_components/SubscriptionDetailApp';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');

  return {
    title: t('subscriptionDetails'),
    robots: { index: false, follow: false },
  };
}

export default async function SubscriptionDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <SubscriptionDetailApp subscriptionId={id} />;
}
