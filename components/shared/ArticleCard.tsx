'use client';

import Link from 'next/link';

export type ArticleCardArticle = {
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string;
};

interface ArticleCardProps {
  article: ArticleCardArticle;
  basePath?: '/insights' | '/academy';
  large?: boolean;
  showImage?: boolean;
  className?: string;
}

export function ArticleCard({
  article,
  basePath = '/insights',
  large = false,
  showImage = true,
  className = '',
}: ArticleCardProps) {
  return (
    <Link
      href={`${basePath}/${article.slug}`}
      className={`group flex flex-col gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-card)] sm:p-8 ${className}`}
    >
      {showImage && (
        <div
          className={`squircle bg-surface-secondary mb-4 w-full shrink-0 overflow-hidden ${
            large ? 'aspect-[16/9]' : 'aspect-[5/3]'
          }`}
        >
          <img src={article.image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
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
