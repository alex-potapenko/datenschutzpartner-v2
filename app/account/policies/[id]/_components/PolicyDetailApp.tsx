'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { useDocument, resolveDocumentSite } from '@/api/documents';
import { GENERATOR_POLICIES_HREF } from '@/app/account/_components/account-sections';
import { Button, Spinner } from '@/components/ui';
import { PolicyDetailTabs } from '@/components/shared/PolicyDetailTabs';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { buildPolicyUpdateUrl } from '@/app/result/wizard-state';
import { DataState } from '@/app/account/_components/account-ui';

export function PolicyDetailApp({ documentId }: { documentId: string }) {
  const t = useTranslations('account.documents');
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('account');
  const router = useRouter();
  const returnTo = `/account/policies/${documentId}`;
  const { isChecking } = useRequireSession(returnTo);
  const document = useDocument(documentId);

  if (isChecking) {
    return (
      <PolicyDetailPageShell backHref={GENERATOR_POLICIES_HREF} backLabel={tCommon('back')}>
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </PolicyDetailPageShell>
    );
  }

  return (
    <PolicyDetailPageShell backHref={GENERATOR_POLICIES_HREF} backLabel={tCommon('back')}>
      <DataState
        isLoading={document.isLoading}
        isError={document.isError}
        onRetry={() => void document.refetch()}
      >
        {document.data ? (
          <PolicyDetailTabs
            document={document.data}
            headerAction={
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  router.push(
                    buildPolicyUpdateUrl(document.data.id, resolveDocumentSite(document.data))
                  );
                }}
              >
                {t('update')}
              </Button>
            }
            onExport={() => {
              toast.success(t('exportStarted'));
            }}
          />
        ) : null}
      </DataState>
    </PolicyDetailPageShell>
  );
}
