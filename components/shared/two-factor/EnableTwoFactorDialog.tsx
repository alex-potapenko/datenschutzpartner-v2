'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useActivateTwoFactor, type TwoFactorSetup } from '@/api/two-factor';
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
import { RecoveryCodesPanel } from './RecoveryCodesPanel';
import { TwoFactorSetupPanel } from './TwoFactorSetupPanel';

type OverlayState = ReturnType<typeof useOverlayState>;
type SetupStage = 'scan' | 'recovery';

export function EnableTwoFactorDialog({
  state,
  accountName,
  setup,
  onClosed,
  onEnabled,
  onLater,
}: {
  state: OverlayState;
  accountName: string;
  setup: TwoFactorSetup | undefined;
  onClosed: () => void;
  onEnabled?: () => void;
  /** Skips setup (e.g. login flow — still signed in, redirect to the app). */
  onLater?: () => void;
}) {
  const t = useTranslations('twoFactor');
  const activate = useActivateTwoFactor();
  const [stage, setStage] = useState<SetupStage>('scan');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [codeInvalid, setCodeInvalid] = useState(false);

  function close() {
    setStage('scan');
    setRecoveryCodes([]);
    setCode('');
    setCodeInvalid(false);
    onClosed();
    state.close();
  }

  function activateWithCode(code: string) {
    setCodeInvalid(false);
    activate.mutate(
      { code },
      {
        onSuccess: (result) => {
          setRecoveryCodes(result.recoveryCodes);
          setStage('recovery');
          toast.success(t('enableSuccess'));
        },
        onError: () => {
          setCodeInvalid(true);
        },
      }
    );
  }

  return (
    <ModalRoot
      state={{
        ...state,
        setOpen: (open: boolean) => {
          if (!open) close();
          state.setOpen(open);
        },
        close,
      }}
    >
      <ModalBackdrop isDismissable={stage === 'scan'}>
        <ModalContainer size="md" className="w-[480px] max-w-[calc(100vw-2rem)]">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{stage === 'scan' ? t('setupTitle') : t('recoveryTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              {stage === 'scan' ? (
                <TwoFactorSetupPanel
                  setup={setup}
                  isVerifying={activate.isPending}
                  isInvalid={codeInvalid}
                  code={code}
                  onCodeChange={setCode}
                  showSubmitButton={false}
                  onSubmit={activateWithCode}
                />
              ) : (
                <RecoveryCodesPanel
                  codes={recoveryCodes}
                  accountName={accountName}
                  confirmLabel={t('recoveryDone')}
                  onConfirm={() => {
                    onEnabled?.();
                    close();
                  }}
                />
              )}
            </ModalBody>
            {stage === 'scan' ? (
              <ModalFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  variant="primary"
                  fullWidth
                  isDisabled={code.length !== 6 || activate.isPending}
                  onPress={() => {
                    activateWithCode(code);
                  }}
                >
                  {t('activateCta')}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onPress={() => {
                    if (onLater) {
                      onLater();
                      return;
                    }
                    close();
                  }}
                >
                  {t('proactiveLater')}
                </Button>
              </ModalFooter>
            ) : null}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
