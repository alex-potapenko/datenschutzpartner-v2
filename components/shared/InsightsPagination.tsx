'use client';

import { useTranslations } from 'next-intl';
import { PagePagination } from './PagePagination';

interface InsightsPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function InsightsPagination({ page, totalPages, onPageChange }: InsightsPaginationProps) {
  const t = useTranslations('insights');

  return (
    <PagePagination
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      className="border-border border-t px-4 py-8 sm:px-8"
      labels={{
        navigation: t('paginationNavigation'),
        previous: t('paginationPrevious'),
        next: t('paginationNext'),
      }}
    />
  );
}
