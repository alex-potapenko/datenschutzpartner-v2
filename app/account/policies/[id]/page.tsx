import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PolicyDetailApp } from './_components/PolicyDetailApp';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.documents');

  return {
    title: t('detailTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function PolicyDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <PolicyDetailApp documentId={id} />;
}
