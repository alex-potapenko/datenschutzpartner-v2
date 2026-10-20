'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useLeaveAffiliateProgram } from '@/api/affiliate';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button, useOverlayState } from '@/components/ui';

type AffiliateQuitProgramLinkProps = {
  onQuitSuccess?: () => void;
  className?: string;
  label?: string;
};

export function AffiliateQuitProgramLink({
  onQuitSuccess,
  className,
  label,
}: AffiliateQuitProgramLinkProps) {
  const t = useTranslations('account.affiliate');
  const tc = useTranslations('common');
  const quitAffiliate = useLeaveAffiliateProgram();
  const quitDialog = useOverlayState();

  function handleQuitAffiliate() {
    void quitAffiliate
      .mutateAsync()
      .then(() => {
        onQuitSuccess?.();
        quitDialog.close();
      })
      .catch(() => {
        toast.error(tc('error'));
      });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onPress={() => {
          quitDialog.open();
        }}
      >
        {label ?? t('pendingCard.quit')}
      </Button>

      <ConfirmDialog
        state={quitDialog}
        title={t('pendingCard.quitConfirm.title')}
        body={t('pendingCard.quitConfirm.body')}
        confirmLabel={t('pendingCard.quitConfirm.confirm')}
        cancelLabel={t('pendingCard.quitConfirm.cancel')}
        isPending={quitAffiliate.isPending}
        onConfirm={handleQuitAffiliate}
      />
    </>
  );
}
