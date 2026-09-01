'use client';

import { useTranslations } from 'next-intl';
import { PRIVACY_POLICY_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { PolicyDetailTabs } from '@/components/shared/PolicyDetailTabs';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import type { GeneratedDocument } from '@/api/documents';

interface GeneratedPolicyStepProps {
  document: GeneratedDocument;
}

export function GeneratedPolicyStep({ document }: GeneratedPolicyStepProps) {
  const tCommon = useTranslations('common');

  return (
    <PolicyDetailPageShell
      backHref={PRIVACY_POLICY_ACCOUNT_HREF}
      backLabel={tCommon('back')}
      detailTitle={tCommon('policyDetails')}
    >
      <PolicyDetailTabs document={document} />
    </PolicyDetailPageShell>
  );
}
