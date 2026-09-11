import { getTranslations } from 'next-intl/server';
import { LegalMarkdown } from '@/components/shared/LegalMarkdown';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { NestedScreenShell } from '@/components/shared/NestedScreenShell';
import {
  getAdjacentInsightArticles,
  insightsListHref,
  type InsightArticle,
} from '@/lib/insights-content';
import { loadInsightBody } from '@/lib/load-insight-content';
import type { Locale } from '@/i18n/config';
import { InsightArticleHero } from './InsightArticleHero';
import { InsightArticleMetaBar } from './InsightArticleMetaBar';
import { InsightArticleNav } from './InsightArticleNav';
import { PodigeePlayer } from './PodigeePlayer';
import {
  INSIGHT_ARTICLE_BODY_CLASS,
  INSIGHT_ARTICLE_CONTENT_CLASS,
  INSIGHT_ARTICLE_SIDEBAR_CLASS,
} from './insight-article-layout';

type InsightArticlePageProps = {
  article: InsightArticle;
  locale: Locale;
};

export async function InsightArticlePage({ article, locale }: InsightArticlePageProps) {
  const t = await getTranslations('insights');
  const body = loadInsightBody(article.slug, locale, article.description);
  const { previous, next } = getAdjacentInsightArticles(locale, article.slug);
  const backHref = insightsListHref(article.tab);

  return (
    <NestedScreenShell
      activePath="/insights"
      noPadding
      backHref={backHref}
      backLabel={t('backToInsights')}
      detailTitle={t('title')}
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
              <NavigationLink href={article.externalUrl}>{t('listenToEpisode')}</NavigationLink>
            </p>
          )}
          <LegalMarkdown source={body} />
          {article.podigeeEmbedUrl && <PodigeePlayer configurationUrl={article.podigeeEmbedUrl} />}
        </div>
      </div>
      <InsightArticleNav previous={previous} next={next} />
    </NestedScreenShell>
  );
}
