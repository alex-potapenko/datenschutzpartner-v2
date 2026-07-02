import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { LegalMarkdown } from '@/components/shared/LegalMarkdown';
import { RegularPage } from '@/components/shared/RegularPage';
import { InsightArticleHero } from '../_components/InsightArticleHero';
import { InsightArticleMetaBar } from '../_components/InsightArticleMetaBar';
import { InsightArticleNav } from '../_components/InsightArticleNav';
import { PodigeePlayer } from '../_components/PodigeePlayer';
import {
  INSIGHT_ARTICLE_BODY_CLASS,
  INSIGHT_ARTICLE_CONTENT_CLASS,
  INSIGHT_ARTICLE_SIDEBAR_CLASS,
} from '../_components/insight-article-layout';
import {
  getAdjacentInsightArticles,
  getAllInsightSlugs,
  getInsightArticleBySlug,
  insightsListHref,
} from '@/lib/insights-content';
import { loadInsightBody } from '@/lib/load-insight-content';
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

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('insights');
  const article = getInsightArticleBySlug(locale, slug);

  if (!article) {
    notFound();
  }

  const body = loadInsightBody(slug, locale, article.description);
  const { previous, next } = getAdjacentInsightArticles(locale, slug);

  return (
    <RegularPage
      activePath="/insights"
      noPadding
      showLogo={false}
      backLink={{ href: insightsListHref(article.tab), label: t('backToInsights') }}
    >
      <InsightArticleHero article={article} />
      <div
        aria-hidden
        className="border-border relative left-1/2 w-screen -translate-x-1/2 border-b"
      />
      <div className={INSIGHT_ARTICLE_BODY_CLASS}>
        <div className={INSIGHT_ARTICLE_SIDEBAR_CLASS}>
          <InsightArticleMetaBar article={article} />
        </div>
        <div className={INSIGHT_ARTICLE_CONTENT_CLASS}>
          {article.externalUrl && !article.podigeeEmbedUrl && (
            <p className="mb-8">
              <a
                href={article.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-base font-normal transition-colors hover:text-[var(--link-hover)]"
                style={{ color: 'var(--accent)' }}
              >
                {t('listenToEpisode')}
              </a>
            </p>
          )}
          <LegalMarkdown source={body} />
          {article.podigeeEmbedUrl && <PodigeePlayer configurationUrl={article.podigeeEmbedUrl} />}
        </div>
      </div>
      <InsightArticleNav previous={previous} next={next} />
    </RegularPage>
  );
}
