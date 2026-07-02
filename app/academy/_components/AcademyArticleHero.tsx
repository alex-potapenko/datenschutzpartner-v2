import { getTranslations } from 'next-intl/server';
import type { AcademyArticle } from '@/lib/academy-content';
import { InsightTypeChip } from '@/app/insights/_components/InsightTypeChip';

interface AcademyArticleHeroProps {
  article: AcademyArticle;
}

export async function AcademyArticleHero({ article }: AcademyArticleHeroProps) {
  const t = await getTranslations('academy');

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden">
      <img
        src={article.image}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15"
      />
      <div aria-hidden className="absolute inset-y-0 right-0 z-[1] w-1/2 backdrop-blur-xl" />
      <div className="relative z-[2] flex h-full flex-col justify-end gap-4 px-4 pt-20 pb-10 sm:px-8">
        <InsightTypeChip label={t(`tabs.${article.tab}`)} />
        <h1 className="max-w-4xl text-2xl font-bold text-white sm:text-3xl">{article.title}</h1>
      </div>
    </div>
  );
}
