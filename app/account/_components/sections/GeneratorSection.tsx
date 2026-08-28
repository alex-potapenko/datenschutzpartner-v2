'use client';

import { useTranslations } from 'next-intl';
import { AccountSectionFrame } from '../account-ui';
import { DocumentsSection } from './DocumentsSection';

export function GeneratorSection() {
  const t = useTranslations('account.generator');

  return (
    <AccountSectionFrame title={t('title')}>
      <div className="-mx-4 sm:-mx-8">
        <DocumentsSection />
      </div>
    </AccountSectionFrame>
  );
}
