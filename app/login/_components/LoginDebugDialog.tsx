'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useDevMemberSignInMethod,
  useDisableLucasTwoFactor,
  useResetAdminTwoFactor,
} from '@/api/auth';
import { MemberSignInMethodDevToggle } from './MemberSignInMethodDevToggle';
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
  const tc = useTranslations('common');
  const memberSignInMethod = useDevMemberSignInMethod();
  const disableLucas2fa = useDisableLucasTwoFactor();
  const resetAdmin2fa = useResetAdminTwoFactor();
  const memberUsesPassword = (memberSignInMethod.data?.method ?? 'magic_link') === 'password';

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
            <ModalBody className="pt-6">
              <div className="text-foreground flex flex-col gap-4 leading-relaxed">
                <div className="flex flex-col gap-2">
                  <p className="text-base font-medium">{t('devAccountMember')}</p>
                  <MemberSignInMethodDevToggle />
                  <div className="flex flex-col gap-0">
                    <p className="text-muted text-sm">
                      {t('email')}:{' '}
                      <span className="text-foreground font-mono break-all">
                        {MOCK_MEMBER_LOGIN.email}
                      </span>
                    </p>
                    <p className="text-muted text-sm">
                      {t('devPasswordLabel')}:{' '}
                      <span className="text-foreground font-mono">
                        {memberUsesPassword ? MOCK_MEMBER_LOGIN.password : tc('notApplicable')}
                      </span>
                    </p>
                    <button
                      type="button"
                      disabled={disableLucas2fa.isPending}
                      onClick={handleDisableLucas2fa}
                      className={cn(
                        navigationLinkClassName('sm'),
                        'w-fit cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      {t('devDisable2fa')}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-medium">{t('devAccountAdmin')}</p>
                  <div className="flex flex-col gap-0">
                    <p className="text-muted text-sm">
                      {t('email')}:{' '}
                      <span className="text-foreground font-mono break-all">
                        {MOCK_ADMIN_LOGIN.email}
                      </span>
                    </p>
                    <p className="text-muted text-sm">
                      {t('devPasswordLabel')}:{' '}
                      <span className="text-foreground font-mono">{MOCK_ADMIN_LOGIN.password}</span>
                    </p>
                    <button
                      type="button"
                      disabled={resetAdmin2fa.isPending}
                      onClick={handleResetAdmin2fa}
                      className={cn(
                        navigationLinkClassName('sm'),
                        'w-fit cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      {t('devReset2fa')}
                    </button>
                  </div>
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
