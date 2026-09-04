'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useDeleteEuRepContract } from '@/api/eu-rep';
import { EU_REP_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button, useOverlayState } from '@/components/ui';

export function EuRepDeleteEntityAction({
  contractId,
  entityName,
}: {
  contractId: string;
  entityName: string;
}) {
  const t = useTranslations('account.euRep.contract');
  const router = useRouter();
  const confirm = useOverlayState();
  const deleteContract = useDeleteEuRepContract();

  async function handleDelete() {
    try {
      await deleteContract.mutateAsync(contractId);
      toast.success(t('deleted'));
      confirm.close();
      router.push(EU_REP_ACCOUNT_HREF);
    } catch {
      toast.error(t('deleteFailed'));
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onPress={() => {
          confirm.open();
        }}
      >
        {t('deleteEntity')}
      </Button>
      <ConfirmDialog
        state={confirm}
        title={t('deleteTitle')}
        body={t('deleteBody', { entity: entityName || t('title') })}
        confirmLabel={t('deleteConfirm')}
        cancelLabel={t('deleteCancel')}
        isPending={deleteContract.isPending}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </>
  );
}
