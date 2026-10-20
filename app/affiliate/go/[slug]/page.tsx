import { Suspense } from 'react';
import { AffiliateRefRedirect } from '@/components/shared/AffiliateRefRedirect';

type AffiliateGoPageProps = {
  params: Promise<{ slug: string }>;
};

/** Legacy partner URL; behaves like `/ref/:slug`. */
export default async function AffiliateGoPage({ params }: AffiliateGoPageProps) {
  const { slug } = await params;
  return (
    <Suspense>
      <AffiliateRefRedirect slug={slug} />
    </Suspense>
  );
}
