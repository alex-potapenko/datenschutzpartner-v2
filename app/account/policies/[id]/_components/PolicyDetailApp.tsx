'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSession } from '@/api/auth';
import { useDocument } from '@/api/documents';
import { Spinner } from '@/components/ui';
import { PolicyDocument, PolicyDocumentHeader } from '@/components/shared/PolicyDocument';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { DataState } from '@/app/account/_components/account-ui';

export function PolicyDetailApp({ documentId }: { documentId: string }) {
  const t = useTranslations('account.documents');
  const tAccount = useTranslations('account');
  const router = useRouter();
  const session = useSession();
  const document = useDocument(documentId);

  const isAuthenticated = Boolean(session.data?.email);
  const backHref = '/account?section=generator';

  useEffect(() => {
    if (!session.isLoading && !session.isError && !isAuthenticated) {
      router.replace(`/login?returnTo=${encodeURIComponent(`/account/policies/${documentId}`)}`);
    }
  }, [session.isLoading, session.isError, isAuthenticated, router, documentId]);

  if (session.isLoading || !isAuthenticated) {
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
          <PolicyDocument
            document={document.data}
            embedInPage
            onExport={() => {
              toast.success(t('exportStarted'));
            }}
          />
        ) : null}
      </DataState>
    </PolicyDetailPageShell>
  );
}
