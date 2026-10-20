import { Suspense } from 'react';
import { AffiliateRefRedirect } from '@/components/shared/AffiliateRefRedirect';

type AffiliateRefPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AffiliateRefPage({ params }: AffiliateRefPageProps) {
  const { slug } = await params;
  return (
    <Suspense>
      <AffiliateRefRedirect slug={slug} />
    </Suspense>
  );
}
