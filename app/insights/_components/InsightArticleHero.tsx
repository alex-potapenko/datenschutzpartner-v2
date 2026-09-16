import { getTranslations } from 'next-intl/server';
import type { InsightArticle } from '@/lib/insights-content';
import { PodcastCoverArt } from '@/components/shared/PodcastCoverArt';
import { InsightTypeChip } from './InsightTypeChip';

interface InsightArticleHeroProps {
  article: InsightArticle;
}

export async function InsightArticleHero({ article }: InsightArticleHeroProps) {
  const t = await getTranslations('insights');

  const cover =
    article.tab === 'podcasts' ? (
      <PodcastCoverArt
        size="featured"
        ringWord1={t('podcastCoverRingWord1')}
        ringWord2={t('podcastCoverRingWord2')}
        className="absolute inset-0 h-full"
        aspectClassName="h-full min-h-full"
      />
    ) : (
      <img
        src={article.image}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
      />
    );

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden">
      {cover}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15"
      />
      <div className="relative z-[2] flex h-full flex-col justify-end gap-4 px-4 pt-20 pb-10 sm:px-8">
        <InsightTypeChip label={t(`tabs.${article.tab}`)} />
        <h1 className="max-w-4xl text-2xl font-bold text-white sm:text-3xl">{article.title}</h1>
      </div>
    </div>
  );
}
