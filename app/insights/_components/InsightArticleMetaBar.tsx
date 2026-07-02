import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { isLiveInsightTab, type InsightArticle } from '@/lib/insights-content';
import { formatInsightLiveAt, isUpcomingWebinar } from '@/lib/webinar-calendar';
import type { Locale } from '@/i18n/config';
import { InsightArticleCalendarButton } from './InsightArticleCalendarButton';
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
  const locale = (await getLocale()) as Locale;
  const isLiveSession = isLiveInsightTab(article.tab);
  const liveAtFormatted =
    isLiveSession && article.liveAt ? formatInsightLiveAt(article.liveAt, locale) : null;

  return (
    <aside className="flex flex-col gap-8">
      {isLiveSession && article.presenter && (
        <PersonMetaBlock label={t('presenter')} name={article.presenter} />
      )}

      <MetaSection>
        <MetaLabel>{isLiveSession ? t('liveAt') : t('published')}</MetaLabel>
        <time className={INSIGHT_META_VALUE_CLASS} dateTime={article.liveAt ?? article.date}>
          {liveAtFormatted ?? article.date}
        </time>
        {isLiveSession &&
          article.liveAt &&
          article.liveAtDurationMinutes &&
          isUpcomingWebinar(article.liveAt, article.liveAtDurationMinutes) && (
            <InsightArticleCalendarButton
              slug={article.slug}
              title={article.title}
              description={article.description}
              liveAt={article.liveAt}
              durationMinutes={article.liveAtDurationMinutes}
            />
          )}
      </MetaSection>

      <MetaSection>
        <InsightArticleShare title={article.title} />
      </MetaSection>
    </aside>
  );
}
