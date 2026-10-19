'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQuitAffiliateProgram } from '@/api/affiliate';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { useOverlayState } from '@/components/ui';

type AffiliateQuitProgramLinkProps = {
  onQuitSuccess?: () => void;
  className?: string;
};

export function AffiliateQuitProgramLink({
  onQuitSuccess,
  className,
}: AffiliateQuitProgramLinkProps) {
  const t = useTranslations('account.affiliate');
  const tc = useTranslations('common');
  const quitAffiliate = useQuitAffiliateProgram();
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
      <NavigationLink
        size="sm"
        chevron="none"
        className={className ?? 'justify-center'}
        onPress={() => {
          quitDialog.open();
        }}
      >
        {t('pendingCard.quit')}
      </NavigationLink>

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
