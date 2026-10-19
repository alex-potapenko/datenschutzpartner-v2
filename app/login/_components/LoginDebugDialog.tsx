'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useDisableLucasTwoFactor, useResetAdminTwoFactor } from '@/api/auth';
import { MOCK_ADMIN_LOGIN, MOCK_MEMBER_LOGIN } from '@/lib/mock-login-accounts';
import { navigationLinkClassName } from '@/components/shared/NavigationLink';
import {
  Button,
  cn,
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

type OverlayState = ReturnType<typeof useOverlayState>;

export function LoginDebugDialog({ state }: { state: OverlayState }) {
  const t = useTranslations('login');
  const disableLucas2fa = useDisableLucasTwoFactor();
  const resetAdmin2fa = useResetAdminTwoFactor();

  function handleDisableLucas2fa() {
    if (disableLucas2fa.isPending) return;

    disableLucas2fa.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('devDisableLucas2faDone'));
      },
      onError: () => {
        toast.error(t('errors.generic'));
      },
    });
  }

  function handleResetAdmin2fa() {
    if (resetAdmin2fa.isPending) return;

    resetAdmin2fa.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('devResetAdmin2faDone'));
      },
      onError: () => {
        toast.error(t('errors.generic'));
      },
    });
  }

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('devDebugTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="text-foreground flex flex-col gap-4 leading-relaxed">
                <div className="flex flex-col gap-0">
                  <p className="text-base font-medium">{t('devAccountMember')}</p>
                  <p className="text-muted font-mono text-sm break-all">
                    {MOCK_MEMBER_LOGIN.email}
                  </p>
                  <button
                    type="button"
                    disabled={disableLucas2fa.isPending}
                    onClick={handleDisableLucas2fa}
                    className={cn(
                      navigationLinkClassName('sm'),
                      'mt-1 w-fit cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    {t('devDisableLucas2fa')}
                  </button>
                </div>
                <div className="flex flex-col gap-0">
                  <p className="text-base font-medium">{t('devAccountAdmin')}</p>
                  <p className="text-foreground text-sm font-medium">
                    {MOCK_ADMIN_LOGIN.displayName}
                  </p>
                  <p className="text-muted font-mono text-sm break-all">{MOCK_ADMIN_LOGIN.email}</p>
                  <p className="text-muted text-sm">
                    {t('devPasswordLabel')}:{' '}
                    <span className="text-foreground font-mono">{MOCK_ADMIN_LOGIN.password}</span>
                  </p>
                  <p className="text-muted text-sm">{t('devAdminPassword2fa')}</p>
                  <button
                    type="button"
                    disabled={resetAdmin2fa.isPending}
                    onClick={handleResetAdmin2fa}
                    className={cn(
                      navigationLinkClassName('sm'),
                      'mt-1 w-fit cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    {t('devResetAdmin2fa')}
                  </button>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                fullWidth
                onPress={() => {
                  state.close();
                }}
              >
                {t('devDebugDone')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
