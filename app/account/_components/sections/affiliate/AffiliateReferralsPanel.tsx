'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AffiliateDashboard } from '@/api/affiliate';
import { PagePagination } from '@/components/shared/PagePagination';
import {
  AffiliateReferralStatusFilter,
  type AffiliateReferralStatusFilterValue,
} from '../../AffiliateReferralStatusFilter';
import { AffiliateReferralsTable } from '../../AffiliateReferralsTable';
import { AccountSection } from '../../account-ui';

const REFERRALS_PAGE_SIZE = 20;

export function AffiliateReferralsPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.dashboard');
  const [filter, setFilter] = useState<AffiliateReferralStatusFilterValue>('all');
  const [page, setPage] = useState(1);
  const title = t('referralsTitle');
  const rows =
    filter === 'all'
      ? dashboard.referrals
      : dashboard.referrals.filter((row) => row.status === filter);
  const totalPages = Math.max(1, Math.ceil(rows.length / REFERRALS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * REFERRALS_PAGE_SIZE,
    currentPage * REFERRALS_PAGE_SIZE
  );

  return (
    <AccountSection title={title} contentClassName="gap-4">
      {dashboard.referrals.length > 0 ? (
        <>
          <AffiliateReferralStatusFilter
            value={filter}
            onChange={(next) => {
              setFilter(next);
              setPage(1);
            }}
          />
          {rows.length > 0 ? (
            <AffiliateReferralsTable referrals={pageRows} ariaLabel={title} />
          ) : (
            <p className="text-muted text-sm leading-relaxed">{t('statusFilter.empty')}</p>
          )}
          <PagePagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            size="sm"
            labels={{
              navigation: t('pagination.label'),
              previous: t('pagination.previous'),
              next: t('pagination.next'),
            }}
          />
        </>
      ) : (
        <p className="text-muted text-sm leading-relaxed">{t('referralsEmpty')}</p>
      )}
    </AccountSection>
  );
}
