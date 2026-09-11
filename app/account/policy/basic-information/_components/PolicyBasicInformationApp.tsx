'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { formatSiteDomain, useDocument } from '@/api/documents';
import { usePolicyMaintenance, useUpdatePolicyBasicInformation } from '@/api/policy-updates';
import {
  QuestionnaireStep,
  type QuestionnaireFormData,
} from '@/app/result/steps/QuestionnaireStep';
import { StepLayout } from '@/app/result/ui/StepLayout';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Spinner, useOverlayState } from '@/components/ui';
import {
  POLICY_BASIC_INFORMATION_HREF,
  privacyPolicyAccountHref,
  safeAccountReturnTo,
} from '@/lib/account-routes';

export function PolicyBasicInformationApp() {
  const t = useTranslations('account.policyUpdates.basic');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useOverlayState();
  const [pendingForm, setPendingForm] = useState<QuestionnaireFormData | null>(null);

  const documentId = searchParams.get('document') ?? '';
  const { isChecking } = useRequireSession(
    `${POLICY_BASIC_INFORMATION_HREF}?document=${encodeURIComponent(documentId)}`
  );

  const document = useDocument(documentId);
  const maintenance = usePolicyMaintenance(documentId);
  const save = useUpdatePolicyBasicInformation(documentId);

  const site = document.data?.site;
  const backHref =
    safeAccountReturnTo(searchParams.get('returnTo')) ??
    privacyPolicyAccountHref({ site, tab: 'details' });

  const isLoading = isChecking || document.isLoading || maintenance.isLoading;
  const basicInformation = maintenance.data?.basicInformation;

  return (
    <StepLayout
      step="questionnaire"
      domain={site ? formatSiteDomain(site) : ''}
      hideDomain={!site}
      quitHref={backHref}
      /* Editing an existing policy must not touch the generator wizard draft. */
      onQuit={() => undefined}
      confirmQuit={false}
      quitLabel={tCommon('back')}
      quitIconOnly
      showStepBar={false}
      scrollStepsWithContent
    >
      {isLoading ? (
        <div className="flex min-h-60 flex-1 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      ) : null}

      {!isLoading && basicInformation && site ? (
        <QuestionnaireStep
          domain={site}
          initialData={basicInformation}
          title={t('screenTitle')}
          ctaLabel={t('save')}
          showCtaCaret={false}
          ctaDisabled={save.isPending}
          requireChanges
          resetLabel={t('reset')}
          onSubmit={(data) => {
            setPendingForm(data);
            confirm.open();
          }}
        />
      ) : null}

      {!isLoading && (!basicInformation || !site) ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-20 text-center">
          <p className="text-foreground text-base font-semibold">{t('notFound')}</p>
        </div>
      ) : null}

      <ConfirmDialog
        state={confirm}
        destructive={false}
        title={t('confirmTitle')}
        body={t('confirmBody')}
        confirmLabel={t('save')}
        cancelLabel={tCommon('cancel')}
        isPending={save.isPending}
        onConfirm={() => {
          if (!pendingForm) return;
          save.mutate(pendingForm, {
            onSuccess: () => {
              confirm.close();
              toast.success(t('saved'));
              router.push(backHref);
            },
            onError: () => {
              confirm.close();
              toast.error(t('saveError'));
            },
          });
        }}
      />
    </StepLayout>
  );
}
