import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubscriptionDetailApp } from './_components/SubscriptionDetailApp';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations('account.documents');

  return {
    title: t('subscriptionGroup', { id }),
    robots: { index: false, follow: false },
  };
}

export default async function SubscriptionDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <SubscriptionDetailApp subscriptionId={id} />;
}
