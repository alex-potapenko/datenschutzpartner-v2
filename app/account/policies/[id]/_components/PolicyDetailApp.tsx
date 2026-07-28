'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { useDocument } from '@/api/documents';
import { Button, Spinner } from '@/components/ui';
import { PolicyDocument, PolicyDocumentHeader } from '@/components/shared/PolicyDocument';
import { PolicyImplementationGuide } from '@/components/shared/PolicyImplementationGuide';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { buildPolicyUpdateUrl } from '@/app/result/wizard-state';
import { DataState } from '@/app/account/_components/account-ui';
import { resolveDocumentSite } from '@/api/documents';

export function PolicyDetailApp({ documentId }: { documentId: string }) {
  const t = useTranslations('account.documents');
  const tAccount = useTranslations('account');
  const router = useRouter();
  const returnTo = `/account/policies/${documentId}`;
  const { isChecking } = useRequireSession(returnTo);
  const document = useDocument(documentId);

  const backHref = '/account?section=generator';

  if (isChecking) {
    return (
      <PolicyDetailPageShell backHref={backHref} backLabel={t('backToList')}>
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </PolicyDetailPageShell>
    );
  }

  return (
    <PolicyDetailPageShell
      backHref={backHref}
      backLabel={t('backToList')}
      header={document.data ? <PolicyDocumentHeader document={document.data} /> : undefined}
    >
      <DataState
        isLoading={document.isLoading}
        isError={document.isError}
        onRetry={() => void document.refetch()}
      >
        {document.data ? (
          <div className="flex flex-col gap-10 pb-10">
            <div className="flex justify-end px-4 sm:px-8">
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
            </div>
            <PolicyImplementationGuide document={document.data} />
            <PolicyDocument
              document={document.data}
              embedInPage
              onExport={() => {
                toast.success(t('exportStarted'));
              }}
            />
          </div>
        ) : null}
      </DataState>
    </PolicyDetailPageShell>
  );
}
