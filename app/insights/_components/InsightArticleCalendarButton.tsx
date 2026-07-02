'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Plus } from '@/components/ui';
import { downloadWebinarCalendarEvent } from '@/lib/webinar-calendar';

type InsightArticleCalendarButtonProps = {
  slug: string;
  title: string;
  description: string;
  liveAt: string;
  durationMinutes: number;
  translationNamespace?: 'insights' | 'academy';
};

export function InsightArticleCalendarButton({
  slug,
  title,
  description,
  liveAt,
  durationMinutes,
  translationNamespace = 'insights',
}: InsightArticleCalendarButtonProps) {
  const t = useTranslations(translationNamespace);

  const handleAddToCalendar = useCallback(() => {
    downloadWebinarCalendarEvent({
      uid: `${slug}@datenschutzpartner.ch`,
      title,
      description,
      liveAt,
      durationMinutes,
      url: window.location.href,
    });
  }, [description, durationMinutes, liveAt, slug, title]);

  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className="mt-2 w-fit"
      onPress={handleAddToCalendar}
    >
      <Plus size={16} weight="bold" aria-hidden />
      {t('addToCalendar')}
    </Button>
  );
}
