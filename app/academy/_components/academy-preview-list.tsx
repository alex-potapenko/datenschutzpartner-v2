import { forwardRef, type ReactNode } from 'react';
import Link from 'next/link';
import { CaretRight, Chip } from '@/components/ui';
import type { Locale } from '@/i18n/config';
import {
  formatAcademyCompactDate,
  formatAcademyCompactTime,
  formatAcademyDateBox,
  resolveAcademyEventImage,
  resolveAcademyEventTitle,
  type AcademyOnDemandItem,
  type AcademyUpcomingEvent,
} from '@/lib/academy-content/events';
import { cn } from '@/lib/utils';

function DateBox({ iso, locale }: { iso: string; locale: Locale }) {
  const { day, month } = formatAcademyDateBox(iso, locale);

  return (
    <div className="squircle-sm bg-background flex size-14 shrink-0 flex-col items-center justify-center gap-1 pt-2.5 pb-2 shadow-[inset_0_0_0_1px_var(--border)]">
      <span className="font-display text-foreground text-xl leading-none font-bold">{day}</span>
      <span className="text-muted text-xs leading-snug">{month}</span>
    </div>
  );
}

function SessionCover({ src }: { src: string }) {
  return (
    <div
      className="squircle-sm aspect-[16/10] h-14 shrink-0 bg-cover bg-center"
      style={{ backgroundImage: `url("${src}")` }}
      aria-hidden
    />
  );
}

function WebinarChip({ label }: { label: string }) {
  return (
    <Chip
      variant="soft"
      size="sm"
      className="[--chip-bg:color-mix(in_srgb,var(--feature-red)_14%,var(--background))] [--chip-fg:var(--feature-red)]"
    >
      {label}
    </Chip>
  );
}

function NewsQuestionsChip({ label }: { label: string }) {
  return (
    <Chip
      variant="soft"
      size="sm"
      className="[--chip-bg:color-mix(in_srgb,var(--feature-purple)_14%,var(--background))] [--chip-fg:var(--feature-purple)]"
    >
      {label}
    </Chip>
  );
}

function PreviewReadMoreIcon() {
  return (
    <CaretRight size={16} weight="bold" aria-hidden className="text-muted shrink-0 self-center" />
  );
}

const sessionListItemInteractiveClassName =
  'hover:outline-solid relative z-0 flex cursor-pointer outline-4 outline-offset-0 outline-transparent transition-[background-color,outline-color] duration-150 hover:z-[1] hover:bg-[color-mix(in_srgb,var(--border)_45%,var(--background))] hover:outline-[color-mix(in_srgb,var(--border)_45%,var(--background))]';

const sessionListItemNextLiveClassName =
  'relative flex cursor-pointer transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--border)_45%,var(--background))]';

const sessionListItemStaticClassName = 'relative flex';

type AcademySessionListItemVariant = 'nextLive' | 'upcoming' | 'pastSession';

function AcademySessionListItemFrame({
  href,
  label,
  interactive,
  variant,
  className,
  children,
}: {
  href?: string;
  label?: string;
  interactive: boolean;
  variant: AcademySessionListItemVariant;
  className?: string;
  children: ReactNode;
}) {
  const isNextLive = variant === 'nextLive';
  const frameClassName = cn(
    interactive
      ? isNextLive
        ? sessionListItemNextLiveClassName
        : sessionListItemInteractiveClassName
      : sessionListItemStaticClassName,
    className
  );

  if (interactive && href && label) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={cn(frameClassName, 'academy-preview-list-row-link text-inherit no-underline')}
      >
        {children}
      </Link>
    );
  }

  return <div className={frameClassName}>{children}</div>;
}

export type AcademyPreviewListLabels = {
  webinarBadge: string;
  newsQuestionsBadge: string;
  readMore: string;
  nextLiveBadge: string;
  tba: string;
};

export const ACADEMY_SESSION_LIST_GAP_PX = 16;
export const ACADEMY_SESSION_ROW_HEIGHT_PX = 56;
export const ACADEMY_SESSION_LIST_CLASS_NAME = '-m-1 flex flex-col gap-4 overflow-visible p-1';

export const AcademySessionList = forwardRef<
  HTMLUListElement,
  { children: ReactNode; className?: string }
>(function AcademySessionList({ children, className }, ref) {
  return (
    <ul ref={ref} className={cn(ACADEMY_SESSION_LIST_CLASS_NAME, className)}>
      {children}
    </ul>
  );
});

export function AcademySessionListItem({
  variant,
  liveAt,
  locale,
  type,
  webinarLabel,
  newsQuestionsLabel,
  title,
  coverImage,
  meta,
  readMoreHref,
  readMoreLabel,
  showTypeChip = true,
  interactive = true,
  nextLiveLabel,
  listItemClassName,
}: {
  variant: AcademySessionListItemVariant;
  liveAt: string;
  locale: Locale;
  type: 'webinar' | 'newsQuestions';
  webinarLabel: string;
  newsQuestionsLabel: string;
  title: ReactNode;
  coverImage?: string;
  meta?: string;
  readMoreHref?: string;
  readMoreLabel?: string;
  showTypeChip?: boolean;
  interactive?: boolean;
  nextLiveLabel?: string;
  listItemClassName?: string;
}) {
  const isWebinar = type === 'webinar';
  const isNextLive = variant === 'nextLive';
  const showDateBox = variant !== 'pastSession';

  const rowContent = (
    <>
      {showDateBox && coverImage ? (
        <div className="flex shrink-0 items-center gap-0">
          <DateBox iso={liveAt} locale={locale} />
          <SessionCover src={coverImage} />
        </div>
      ) : (
        <>
          {showDateBox ? <DateBox iso={liveAt} locale={locale} /> : null}
          {coverImage ? <SessionCover src={coverImage} /> : null}
        </>
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        {title}
        {showTypeChip ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {isWebinar ? (
              <WebinarChip label={webinarLabel} />
            ) : (
              <NewsQuestionsChip label={newsQuestionsLabel} />
            )}
            {meta ? <p className="text-muted text-sm leading-snug">{meta}</p> : null}
          </div>
        ) : meta ? (
          <p className="text-muted text-sm leading-snug">{meta}</p>
        ) : null}
      </div>
      {interactive && readMoreHref && readMoreLabel ? <PreviewReadMoreIcon /> : null}
    </>
  );

  return (
    <li className={listItemClassName}>
      <AcademySessionListItemFrame
        href={readMoreHref}
        label={readMoreLabel}
        interactive={interactive}
        variant={variant}
        className={cn(
          'min-w-0 rounded-xl',
          isNextLive
            ? 'squircle w-full flex-col items-stretch gap-4 p-4 shadow-[inset_0_0_0_2px_var(--key-500)]'
            : 'items-center gap-4'
        )}
      >
        {isNextLive && nextLiveLabel ? (
          <p className="font-display text-foreground block text-base leading-none font-semibold">
            {nextLiveLabel}
          </p>
        ) : null}
        {isNextLive ? (
          <div className="flex w-full min-w-0 items-center gap-4">{rowContent}</div>
        ) : (
          rowContent
        )}
      </AcademySessionListItemFrame>
    </li>
  );
}

export function upcomingEventHref(event: AcademyUpcomingEvent): string {
  return event.slug ? `/insights/${event.slug}` : '#membership';
}

export function pastSessionHref(item: AcademyOnDemandItem): string {
  return `/insights/${item.slug}`;
}

export function NextLiveSessionRow({
  event,
  title,
  locale,
  labels,
  showTypeChip = true,
}: {
  event: AcademyUpcomingEvent;
  title: string;
  locale: Locale;
  labels: AcademyPreviewListLabels;
  showTypeChip?: boolean;
}) {
  return (
    <AcademySessionListItem
      variant="nextLive"
      liveAt={event.liveAt}
      locale={locale}
      type={event.type}
      webinarLabel={labels.webinarBadge}
      newsQuestionsLabel={labels.newsQuestionsBadge}
      readMoreHref={upcomingEventHref(event)}
      readMoreLabel={title}
      coverImage={resolveAcademyEventImage(locale, event)}
      meta={formatAcademyCompactTime(event.liveAt, locale)}
      showTypeChip={showTypeChip}
      nextLiveLabel={labels.nextLiveBadge}
      title={
        <p className="text-foreground w-full truncate text-base leading-tight font-medium">
          {title}
        </p>
      }
    />
  );
}

export function UpcomingCompactRow({
  event,
  locale,
  labels,
  showTypeChip = true,
  listItemClassName,
}: {
  event: AcademyUpcomingEvent;
  locale: Locale;
  labels: AcademyPreviewListLabels;
  showTypeChip?: boolean;
  listItemClassName?: string;
}) {
  const resolvedTitle = resolveAcademyEventTitle(locale, event);
  const coverImage = resolveAcademyEventImage(locale, event);
  const isTbaWebinar = event.type === 'webinar' && !resolvedTitle;
  const displayTitle = isTbaWebinar ? labels.tba : resolvedTitle;

  return (
    <AcademySessionListItem
      variant="upcoming"
      liveAt={event.liveAt}
      locale={locale}
      type={event.type}
      webinarLabel={labels.webinarBadge}
      newsQuestionsLabel={labels.newsQuestionsBadge}
      interactive={!isTbaWebinar}
      readMoreHref={isTbaWebinar ? undefined : upcomingEventHref(event)}
      readMoreLabel={displayTitle ?? labels.readMore}
      coverImage={coverImage}
      meta={formatAcademyCompactTime(event.liveAt, locale)}
      showTypeChip={showTypeChip}
      listItemClassName={listItemClassName}
      title={
        displayTitle ? (
          <p className="text-foreground w-full truncate text-base leading-tight font-medium">
            {displayTitle}
          </p>
        ) : null
      }
    />
  );
}

export function PastSessionRow({
  item,
  locale,
  labels,
  showTypeChip = true,
  showCoverImage = true,
}: {
  item: AcademyOnDemandItem;
  locale: Locale;
  labels: AcademyPreviewListLabels;
  showTypeChip?: boolean;
  showCoverImage?: boolean;
}) {
  return (
    <AcademySessionListItem
      variant="pastSession"
      liveAt={item.liveAt}
      locale={locale}
      type={item.type}
      webinarLabel={labels.webinarBadge}
      newsQuestionsLabel={labels.newsQuestionsBadge}
      readMoreHref={pastSessionHref(item)}
      readMoreLabel={item.title}
      coverImage={showCoverImage ? item.image : undefined}
      meta={formatAcademyCompactDate(item.liveAt, locale)}
      showTypeChip={showTypeChip}
      title={
        <p className="text-foreground w-full truncate text-base leading-tight font-medium">
          {item.title}
        </p>
      }
    />
  );
}
