'use client';

import { useTranslations } from 'next-intl';
import { useRequireSession } from '@/api/auth';
import { useDocument } from '@/api/documents';
import { GENERATOR_POLICIES_HREF } from '@/app/account/_components/account-sections';
import { Spinner } from '@/components/ui';
import { PolicyDetailTabs } from '@/components/shared/PolicyDetailTabs';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { DataState } from '@/app/account/_components/account-ui';

export function PolicyDetailApp({ documentId }: { documentId: string }) {
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('account');
  const returnTo = `/account/policies/${documentId}`;
  const { isChecking } = useRequireSession(returnTo);
  const document = useDocument(documentId);
  const detailTitle = tCommon('policyDetails');

  if (isChecking) {
    return (
      <PolicyDetailPageShell
        backHref={GENERATOR_POLICIES_HREF}
        backLabel={tCommon('back')}
        detailTitle={detailTitle}
      >
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </PolicyDetailPageShell>
    );
  }

  return (
    <PolicyDetailPageShell
      backHref={GENERATOR_POLICIES_HREF}
      backLabel={tCommon('back')}
      detailTitle={detailTitle}
    >
      <DataState
        isLoading={document.isLoading}
        isError={document.isError}
        onRetry={() => void document.refetch()}
      >
        {document.data ? <PolicyDetailTabs document={document.data} /> : null}
      </DataState>
    </PolicyDetailPageShell>
  );
}
