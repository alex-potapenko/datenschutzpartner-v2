import { redirect } from 'next/navigation';
import { getAllInsightSlugs } from '@/lib/insights-content';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllInsightSlugs().map((slug) => ({ slug }));
}

export default async function AcademyArticleRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/insights/${slug}`);
}
