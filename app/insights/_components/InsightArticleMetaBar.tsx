import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import type { InsightArticle } from '@/lib/insights-content';
import { InsightArticleShare } from './InsightArticleShare';
import { INSIGHT_META_LABEL_CLASS, INSIGHT_META_VALUE_CLASS } from './insight-article-layout';

type InsightArticleMetaBarProps = {
  article: InsightArticle;
};

const MARTIN_STEIGER_PHOTO = '/photo-martin.jpg';

function PersonAvatar({ name }: { name: string }) {
  return (
    <img
      src={MARTIN_STEIGER_PHOTO}
      alt={name}
      className="size-20 shrink-0 rounded-full object-cover"
    />
  );
}

function MetaLabel({ children }: { children: ReactNode }) {
  return <span className={INSIGHT_META_LABEL_CLASS}>{children}</span>;
}

function PersonMetaBlock({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PersonAvatar name={name} />
      <div className="flex flex-col gap-1">
        <MetaLabel>{label}</MetaLabel>
        <p className={INSIGHT_META_VALUE_CLASS}>{name}</p>
      </div>
    </div>
  );
}

function MetaSection({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

export async function InsightArticleMetaBar({ article }: InsightArticleMetaBarProps) {
  const t = await getTranslations('insights');

  return (
    <aside className="flex flex-col gap-8">
      {article.author && <PersonMetaBlock label={t('author')} name={article.author} />}

      <MetaSection>
        <MetaLabel>{t('published')}</MetaLabel>
        <time className={INSIGHT_META_VALUE_CLASS} dateTime={article.date}>
          {article.date}
        </time>
      </MetaSection>

      <MetaSection>
        <InsightArticleShare title={article.title} />
      </MetaSection>
    </aside>
  );
}
