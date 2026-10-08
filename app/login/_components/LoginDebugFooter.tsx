'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useDevAdminLoginWithoutTwoFactor } from '@/api/auth';
import { env } from '@/env';
import { readPrototypeMagicLoginUrl } from '@/lib/magic-login-prototype';
import { storeLoginCredential } from '@/lib/store-login-credential';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { useOverlayState } from '@/components/ui';
import { LoginDebugDialog } from './LoginDebugDialog';
import { useLoginDev } from './login-dev-context';

export function LoginDebugFooter() {
  const t = useTranslations('login');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dev = useLoginDev();
  const debugDialog = useOverlayState();
  const adminBypassLogin = useDevAdminLoginWithoutTwoFactor();

  if (env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return null;
  }

  const isForgotPassword = pathname.endsWith('/forgot-password');
  const isMagicLinkVerify = pathname.endsWith('/verify');

  if (isForgotPassword || isMagicLinkVerify) {
    return null;
  }

  const showDebugInfo = dev.step === 'email';
  const showMagicLink = dev.step === 'magic_link_sent' && dev.prototypeMagicLinkReady;
  const showAdminDisable2fa = dev.step === 'totp' && dev.adminLoginBypass !== null;

  if (!showDebugInfo && !showMagicLink && !showAdminDisable2fa) {
    return null;
  }

  const returnTo = searchParams.get('returnTo') ?? '/account';

  function openPrototypeMagicLink() {
    const url = dev.prototypeMagicLinkUrl ?? readPrototypeMagicLoginUrl();
    if (!url) {
      toast.error(t('devMagicLinkMissing'));
      return;
    }
    router.push(url);
  }

  function handleAdminDisable2faLogin() {
    const credentials = dev.adminLoginBypass;
    if (!credentials || adminBypassLogin.isPending) return;

    adminBypassLogin.mutate(credentials, {
      onSuccess: () => {
        void storeLoginCredential(credentials.email, credentials.password).then(() => {
          toast.success(t('success'));
          router.push(returnTo);
        });
      },
      onError: () => {
        toast.error(t('errors.invalidCredentials'));
      },
    });
  }

  return (
    <>
      <div className="mt-auto px-4 pb-4 lg:px-8">
        <div className="mx-auto flex w-full max-w-md justify-center lg:mx-0 lg:max-w-none">
          {showDebugInfo ? (
            <NavigationLink
              size="sm"
              chevron="none"
              onPress={() => {
                debugDialog.open();
              }}
            >
              {t('devShowDebugInfo')}
            </NavigationLink>
          ) : null}
          {showMagicLink ? (
            <NavigationLink size="sm" chevron="right" onPress={openPrototypeMagicLink}>
              {t('devAdminMagicLink')}
            </NavigationLink>
          ) : null}
          {showAdminDisable2fa ? (
            <NavigationLink size="sm" chevron="none" onPress={handleAdminDisable2faLogin}>
              {t('devAdminDisable2faLogin')}
            </NavigationLink>
          ) : null}
        </div>
      </div>
      <LoginDebugDialog state={debugDialog} />
    </>
  );
}
