'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { GENERATOR_POLICIES_HREF } from '@/app/account/_components/account-sections';
import { PolicyDetailTabs } from '@/components/shared/PolicyDetailTabs';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import type { GeneratedDocument } from '@/api/documents';

interface GeneratedPolicyStepProps {
  document: GeneratedDocument;
}

export function GeneratedPolicyStep({ document }: GeneratedPolicyStepProps) {
  const tCommon = useTranslations('common');
  const tDocuments = useTranslations('account.documents');

  return (
    <PolicyDetailPageShell backHref={GENERATOR_POLICIES_HREF} backLabel={tCommon('back')}>
      <PolicyDetailTabs
        document={document}
        showVersions={false}
        defaultTab="instruction"
        onExport={() => {
          toast.success(tDocuments('exportStarted'));
        }}
      />
    </PolicyDetailPageShell>
  );
}
