import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CaretLeft, CaretRight } from '@/components/ui';
import type { AcademyArticle } from '@/lib/academy-content';

type AcademyArticleNavProps = {
  previous?: AcademyArticle;
  next?: AcademyArticle;
};

function NavCard({
  article,
  direction,
  label,
  className,
}: {
  article: AcademyArticle;
  direction: 'previous' | 'next';
  label: string;
  className?: string;
}) {
  const isNext = direction === 'next';

  return (
    <Link
      href={`/academy/${article.slug}`}
      className={[
        'group flex flex-col gap-2 p-4 transition-shadow hover:shadow-[var(--shadow-card)] sm:p-8',
        isNext ? 'sm:items-end sm:text-right' : '',
        className ?? '',
      ].join(' ')}
    >
      <span className="text-muted flex items-center gap-2 text-xs">
        {!isNext && <CaretLeft size={14} weight="bold" aria-hidden />}
        {label}
        {isNext && <CaretRight size={14} weight="bold" aria-hidden />}
      </span>
      <h3 className="text-foreground text-lg leading-snug font-semibold transition-colors group-hover:text-[var(--accent)]">
        {article.title}
      </h3>
    </Link>
  );
}

export async function AcademyArticleNav({ previous, next }: AcademyArticleNavProps) {
  if (!previous && !next) {
    return null;
  }

  const t = await getTranslations('academy');

  return (
    <section className="border-border border-t">
      <nav aria-label={t('articleNavigation')} className="grid grid-cols-1 sm:grid-cols-2">
        {previous ? (
          <NavCard
            article={previous}
            direction="previous"
            label={t('previousArticle')}
            className="border-border border-b sm:border-r sm:border-b-0"
          />
        ) : (
          <div aria-hidden className="hidden sm:block" />
        )}
        {next ? (
          <NavCard article={next} direction="next" label={t('nextArticle')} />
        ) : (
          <div aria-hidden className="hidden sm:block" />
        )}
      </nav>
    </section>
  );
}
