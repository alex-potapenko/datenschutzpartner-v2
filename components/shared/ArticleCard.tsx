import Link from 'next/link';
import { CaretRight } from '@/components/ui';

export type Article = {
  category: string;
  date: string;
  title: string;
  description: string;
  href: string;
  readTime: string;
  image: string;
};

interface ArticleCardProps {
  article: Article;
  large?: boolean;
  showImage?: boolean;
  className?: string;
}

export function ArticleCard({
  article,
  large = false,
  showImage = true,
  className = '',
}: ArticleCardProps) {
  return (
    <div
      className={`group flex flex-col gap-4 p-8 transition-shadow hover:shadow-[var(--shadow-card)] ${className}`}
    >
      {showImage && (
        <div
          className={`squircle bg-surface-secondary mb-4 w-full shrink-0 overflow-hidden ${
            large ? 'aspect-[16/9]' : 'aspect-[5/3]'
          }`}
        >
          <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <span className="text-muted text-xs">{article.date}</span>
        <h3 className="text-foreground text-xl leading-snug font-semibold transition-colors group-hover:text-[var(--accent)]">
          {article.title}
        </h3>
      </div>
      <p className="text-muted text-sm">{article.description}</p>
      <Link
        href={article.href}
        className="mt-auto inline-flex items-center gap-1 text-base font-medium transition-opacity hover:opacity-70"
        style={{ color: 'var(--accent)' }}
      >
        Read more <CaretRight size={16} />
      </Link>
    </div>
  );
}
