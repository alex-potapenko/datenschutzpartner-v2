import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EuRepContractDetailApp } from './_components/EuRepContractDetailApp';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.euRep.contract');

  return {
    title: t('detailTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function EuRepContractDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <EuRepContractDetailApp contractId={id} />;
}
