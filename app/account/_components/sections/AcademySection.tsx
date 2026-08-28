'use client';

import { useTranslations } from 'next-intl';
import { AccountSectionFrame } from '../account-ui';
import { MembershipPanel } from './MembershipPanel';

export function AcademySection({
  onNavigateToAccountDetails,
}: {
  onNavigateToAccountDetails?: () => void;
} = {}) {
  const t = useTranslations('account.academy');

  return (
    <AccountSectionFrame title={t('title')}>
      <MembershipPanel
        productType="academy"
        onManagePayment={() => onNavigateToAccountDetails?.()}
      />
    </AccountSectionFrame>
  );
}
