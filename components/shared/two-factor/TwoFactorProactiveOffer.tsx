'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useDismissTwoFactorSetupSuggestion,
  useStartTwoFactorSetup,
  useTwoFactorStatus,
} from '@/api/two-factor';
import {
  Button,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalRoot,
  useOverlayState,
} from '@/components/ui';
import { EnableTwoFactorDialog } from './EnableTwoFactorDialog';

/** Optional 2FA nudge — used on the login screen right after sign-in. */
export function TwoFactorProactiveOffer({
  open,
  reopenNonce,
  accountEmail,
  onFinished,
}: {
  open: boolean;
  /** Bumped when the login form re-submits while this prompt is still outstanding. */
  reopenNonce: number;
  accountEmail: string;
  onFinished: () => void;
}) {
  const t = useTranslations('twoFactor');
  const status = useTwoFactorStatus(open);
  const introDialog = useOverlayState();
  const enableDialog = useOverlayState();
  const startSetup = useStartTwoFactorSetup();
  const dismissSuggestion = useDismissTwoFactorSetupSuggestion();
  useEffect(() => {
    if (!open) {
      introDialog.close();
      enableDialog.close();
      return;
    }
    if (!status.data || status.data.enabled) return;
    // Setup flow is already open — do not stack the intro on top of it.
    if (enableDialog.isOpen || startSetup.isPending || startSetup.data) return;

    introDialog.open();
  }, [
    enableDialog,
    introDialog,
    open,
    reopenNonce,
    startSetup.data,
    startSetup.isPending,
    status.data,
  ]);

  function finish() {
    introDialog.close();
    enableDialog.close();
    startSetup.reset();
    onFinished();
  }

  function beginSetup() {
    startSetup.mutate(
      {},
      {
        onSuccess: () => {
          introDialog.close();
          enableDialog.open();
        },
        onError: () => {
          toast.error(t('setupFailed'));
        },
      }
    );
  }

  function deferTwoFactorSetup() {
    dismissSuggestion.mutate(undefined, {
      onSuccess: finish,
      onError: finish,
    });
  }

  if (!open) {
    return null;
  }

  return (
    <>
      {introDialog.isOpen ? (
        <ModalRoot state={introDialog}>
          <ModalBackdrop isDismissable={false}>
            <ModalContainer size="sm">
              <ModalDialog>
                <ModalHeader>
                  <ModalHeading>{t('proactiveTitle')}</ModalHeading>
                </ModalHeader>
                <ModalBody>
                  <p className="text-foreground text-sm leading-relaxed">{t('proactiveBody')}</p>
                </ModalBody>
                <ModalFooter className="flex-col gap-2 sm:flex-col">
                  <Button
                    variant="primary"
                    fullWidth
                    isDisabled={startSetup.isPending}
                    onPress={beginSetup}
                  >
                    {t('proactiveCta')}
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    isDisabled={dismissSuggestion.isPending}
                    onPress={deferTwoFactorSetup}
                  >
                    {t('proactiveLater')}
                  </Button>
                </ModalFooter>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </ModalRoot>
      ) : null}
      {enableDialog.isOpen ? (
        <EnableTwoFactorDialog
          state={enableDialog}
          accountName={accountEmail}
          setup={startSetup.data}
          isLaterPending={dismissSuggestion.isPending}
          onClosed={() => {
            startSetup.reset();
          }}
          onEnabled={finish}
          onLater={deferTwoFactorSetup}
        />
      ) : null}
    </>
  );
}
