import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { InsightArticlePage } from '@/app/insights/_components/InsightArticlePage';
import { getAllInsightSlugs, getInsightArticleBySlug } from '@/lib/insights-content';
import type { Locale } from '@/i18n/config';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllInsightSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const article = getInsightArticleBySlug(locale, slug);

  if (!article) {
    return {};
  }

  const t = await getTranslations('insights');

  return {
    title: t('articleMetaTitle', { title: article.title }),
    description: article.description,
  };
}

export default async function InsightArticleRoute({ params }: PageProps) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const article = getInsightArticleBySlug(locale, slug);

  if (!article) {
    notFound();
  }

  return <InsightArticlePage article={article} locale={locale} />;
}
