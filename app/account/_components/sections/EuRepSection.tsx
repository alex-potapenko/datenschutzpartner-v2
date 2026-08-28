'use client';

import { useTranslations } from 'next-intl';
import { AccountSectionFrame } from '../account-ui';
import { EuRepContractPanel } from './EuRepContractPanel';

export function EuRepSection() {
  const t = useTranslations('account.euRep');

  return (
    <AccountSectionFrame title={t('title')}>
      <div className="-mx-4 sm:-mx-8">
        <EuRepContractPanel />
      </div>
    </AccountSectionFrame>
  );
}
