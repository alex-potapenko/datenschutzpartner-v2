'use client';

import { useTranslations } from 'next-intl';
import type { AffiliateReferralStatus } from '@/api/affiliate';
import { Tabs } from '@/components/ui';
import { AFFILIATE_REFERRAL_STATUSES } from '@/lib/affiliate-ledger';

export type AffiliateReferralStatusFilterValue = AffiliateReferralStatus | 'all';

const STATUS_FILTERS: AffiliateReferralStatusFilterValue[] = [
  'all',
  ...AFFILIATE_REFERRAL_STATUSES,
];

export function AffiliateReferralStatusFilter({
  value,
  onChange,
}: {
  value: AffiliateReferralStatusFilterValue;
  onChange: (value: AffiliateReferralStatusFilterValue) => void;
}) {
  const t = useTranslations('account.affiliate.dashboard');

  return (
    <Tabs
      selectedKey={value}
      onSelectionChange={(key) => {
        onChange(String(key) as AffiliateReferralStatusFilterValue);
      }}
    >
      <Tabs.ListContainer className="overflow-x-auto">
        <Tabs.List aria-label={t('statusFilter.label')} className="!w-auto max-w-full">
          {STATUS_FILTERS.map((id) => (
            <Tabs.Tab key={id} id={id} className="!h-auto !w-auto shrink-0">
              <span className="text-sm font-medium whitespace-nowrap">
                {id === 'all' ? t('statusFilter.all') : t(`referralStatus.${id}`)}
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
