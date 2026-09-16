'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { InsightsTab } from '@/lib/insights-content';
import { PodcastCoverArt, PODCAST_COVER_ASPECT_CLASS } from '@/components/shared/PodcastCoverArt';

export type ArticleCardArticle = {
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string;
  tab?: InsightsTab;
};

interface ArticleCardProps {
  article: ArticleCardArticle;
  basePath: '/insights';
  large?: boolean;
  showImage?: boolean;
  className?: string;
}

export function ArticleCard({
  article,
  basePath,
  large = false,
  showImage = true,
  className = '',
}: ArticleCardProps) {
  const tInsights = useTranslations('insights');

  return (
    <Link
      href={
        article.tab
          ? `${basePath}/${article.slug}?tab=${article.tab}`
          : `${basePath}/${article.slug}`
      }
      className={`group flex flex-col gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-card)] sm:p-8 ${className}`}
    >
      {showImage &&
        (article.tab === 'podcasts' ? (
          large ? (
            <PodcastCoverArt
              className="mb-4"
              aspectClassName={PODCAST_COVER_ASPECT_CLASS}
              size="featured"
              ringWord1={tInsights('podcastCoverRingWord1')}
              ringWord2={tInsights('podcastCoverRingWord2')}
            />
          ) : null
        ) : (
          <div
            className={`squircle bg-surface-secondary mb-4 w-full shrink-0 overflow-hidden ${
              large ? 'aspect-[16/9]' : 'aspect-[5/3]'
            }`}
          >
            <img src={article.image} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      <div className="flex flex-col gap-2">
        <span className="text-muted text-xs">{article.date}</span>
        <h3 className="text-foreground text-lg leading-snug font-semibold transition-colors group-hover:text-[var(--accent)]">
          {article.title}
        </h3>
      </div>
      <p className="text-muted text-sm">{article.description}</p>
    </Link>
  );
}
