'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { PolicyDocument, PolicyDocumentHeader } from '@/components/shared/PolicyDocument';
import { PolicyImplementationGuide } from '@/components/shared/PolicyImplementationGuide';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import type { GeneratedDocument } from '@/api/documents';

interface GeneratedPolicyStepProps {
  document: GeneratedDocument;
}

export function GeneratedPolicyStep({ document }: GeneratedPolicyStepProps) {
  const t = useTranslations('result.generatedPolicy');
  const tDocuments = useTranslations('account.documents');
  const router = useRouter();
  const backHref = '/account?section=generator';

  return (
    <PolicyDetailPageShell
      backHref={backHref}
      backLabel={tDocuments('backToList')}
      header={<PolicyDocumentHeader document={document} />}
    >
      <div className="flex flex-col gap-10">
        <PolicyImplementationGuide document={document} />

        <PolicyDocument
          document={document}
          embedInPage
          showVersions={false}
          onExport={() => {
            toast.success(tDocuments('exportStarted'));
          }}
        />

        <div className="flex justify-end px-8 pb-10">
          <Button
            variant="primary"
            size="lg"
            className="h-12 rounded-full"
            onPress={() => {
              router.push(backHref);
            }}
          >
            {t('goToAccount')}
          </Button>
        </div>
      </div>
    </PolicyDetailPageShell>
  );
}
