import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AcademyArticle } from '@/lib/academy-content';
import { formatInsightLiveAt, isUpcomingWebinar } from '@/lib/webinar-calendar';
import type { Locale } from '@/i18n/config';
import { InsightArticleCalendarButton } from '@/app/insights/_components/InsightArticleCalendarButton';
import { InsightArticleShare } from '@/app/insights/_components/InsightArticleShare';
import {
  INSIGHT_META_LABEL_CLASS,
  INSIGHT_META_VALUE_CLASS,
} from '@/app/insights/_components/insight-article-layout';

type AcademyArticleMetaBarProps = {
  article: AcademyArticle;
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

function PersonMetaBlock({ label, name, role }: { label: string; name: string; role?: string }) {
  const displayName = role ? `${name}, ${role}` : name;

  return (
    <div className="flex flex-col gap-4">
      <PersonAvatar name={name} />
      <div className="flex flex-col gap-1">
        <MetaLabel>{label}</MetaLabel>
        <p className={INSIGHT_META_VALUE_CLASS}>{displayName}</p>
      </div>
    </div>
  );
}

function MetaSection({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

export async function AcademyArticleMetaBar({ article }: AcademyArticleMetaBarProps) {
  const t = await getTranslations('academy');
  const locale = (await getLocale()) as Locale;
  const isWebinar = article.tab === 'webinars';
  const liveAtFormatted =
    isWebinar && article.liveAt ? formatInsightLiveAt(article.liveAt, locale) : null;

  return (
    <aside className="flex flex-col gap-8">
      {article.tab === 'newsQuestions' && article.author && (
        <PersonMetaBlock label={t('author')} name={article.author} role={t('authorRoleDefault')} />
      )}

      {article.tab === 'webinars' && article.presenter && (
        <PersonMetaBlock label={t('presenter')} name={article.presenter} />
      )}

      <MetaSection>
        <MetaLabel>{isWebinar ? t('liveAt') : t('published')}</MetaLabel>
        <time className={INSIGHT_META_VALUE_CLASS} dateTime={article.liveAt ?? article.date}>
          {liveAtFormatted ?? article.date}
        </time>
        {isWebinar &&
          article.liveAt &&
          article.liveAtDurationMinutes &&
          isUpcomingWebinar(article.liveAt, article.liveAtDurationMinutes) && (
            <InsightArticleCalendarButton
              slug={article.slug}
              title={article.title}
              description={article.description}
              liveAt={article.liveAt}
              durationMinutes={article.liveAtDurationMinutes}
              translationNamespace="academy"
            />
          )}
      </MetaSection>

      <MetaSection>
        <InsightArticleShare title={article.title} translationNamespace="academy" />
      </MetaSection>
    </aside>
  );
}
