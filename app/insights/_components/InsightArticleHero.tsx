import { getTranslations } from 'next-intl/server';
import type { InsightArticle } from '@/lib/insights-content';
import { PodcastCoverArt } from '@/components/shared/PodcastCoverArt';
import { cn } from '@/lib/utils';
import { InsightTypeChip } from './InsightTypeChip';

interface InsightArticleHeroProps {
  article: InsightArticle;
}

export async function InsightArticleHero({ article }: InsightArticleHeroProps) {
  const t = await getTranslations('insights');
  const isPodcast = article.tab === 'podcasts';

  const cover = isPodcast ? (
    <PodcastCoverArt
      size="featured"
      rounded={false}
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
      {isPodcast ? null : (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15"
        />
      )}
      <div className="relative z-[2] flex h-full flex-col justify-end gap-4 px-4 pt-20 pb-10 sm:px-8">
        <InsightTypeChip
          label={t(`tabs.${article.tab}`)}
          className={
            isPodcast
              ? 'text-foreground border-black/[0.12] bg-transparent hover:bg-transparent'
              : undefined
          }
        />
        <h1
          className={cn(
            'max-w-4xl text-2xl font-bold sm:text-3xl',
            isPodcast ? 'text-foreground' : 'text-white'
          )}
        >
          {article.title}
        </h1>
      </div>
    </div>
  );
}
