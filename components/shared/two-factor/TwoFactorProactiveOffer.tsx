'use client';

import { useEffect, useRef } from 'react';
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
  accountEmail,
  onFinished,
}: {
  open: boolean;
  accountEmail: string;
  onFinished: () => void;
}) {
  const t = useTranslations('twoFactor');
  const status = useTwoFactorStatus(open);
  const introDialog = useOverlayState();
  const enableDialog = useOverlayState();
  const startSetup = useStartTwoFactorSetup();
  const dismissSuggestion = useDismissTwoFactorSetupSuggestion();
  const openedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      return;
    }
    if (openedRef.current) return;
    if (!status.data || status.data.enabled) return;

    openedRef.current = true;
    introDialog.open();
  }, [introDialog, open, status.data]);

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
      <EnableTwoFactorDialog
        state={enableDialog}
        accountName={accountEmail}
        setup={startSetup.data}
        onClosed={() => {
          startSetup.reset();
        }}
        onEnabled={finish}
        onLater={deferTwoFactorSetup}
      />
    </>
  );
}
