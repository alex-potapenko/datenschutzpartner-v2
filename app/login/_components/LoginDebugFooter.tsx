'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { env } from '@/env';
import { readPrototypeMagicLoginUrl } from '@/lib/magic-login-prototype';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { useDevLucasTwoFactorPrototypeCode } from '@/api/auth';
import { useOverlayState } from '@/components/ui';
import { LoginDebugDialog } from './LoginDebugDialog';
import { useLoginDev } from './login-dev-context';

export function LoginDebugFooter() {
  const t = useTranslations('login');
  const tForgot = useTranslations('forgotPassword');
  const pathname = usePathname();
  const router = useRouter();
  const dev = useLoginDev();
  const debugDialog = useOverlayState();
  const lucasTotpDebug = useDevLucasTwoFactorPrototypeCode(dev.step === 'totp');

  if (env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return null;
  }

  const isForgotPassword = pathname.endsWith('/forgot-password');
  const isMagicLinkVerify = pathname.endsWith('/verify');

  if (isMagicLinkVerify) {
    return null;
  }

  if (isForgotPassword) {
    if (!dev.prototypePasswordSetupUrl) {
      return null;
    }

    return (
      <div className="mt-auto px-4 pb-4 lg:px-8">
        <div className="mx-auto flex w-full max-w-md justify-center lg:mx-0 lg:max-w-none">
          <NavigationLink size="sm" chevron="right" href={dev.prototypePasswordSetupUrl}>
            {tForgot('prototypeLink')}
          </NavigationLink>
        </div>
      </div>
    );
  }

  const showDebugInfo = dev.step === 'email';
  const showMagicLink = dev.step === 'magic_link_sent' && dev.prototypeMagicLinkReady;
  const showTotpPrototype = dev.step === 'totp';

  if (!showDebugInfo && !showMagicLink && !showTotpPrototype) {
    return null;
  }

  function openPrototypeMagicLink() {
    const url = dev.prototypeMagicLinkUrl ?? readPrototypeMagicLoginUrl();
    if (!url) {
      toast.error(t('devMagicLinkMissing'));
      return;
    }
    router.push(url);
  }

  return (
    <>
      <div className="mt-auto px-4 pb-4 lg:px-8">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 lg:mx-0 lg:max-w-none">
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
          {showTotpPrototype ? (
            <p className="text-muted max-w-md text-center text-xs leading-relaxed">
              {lucasTotpDebug.data?.enabled && lucasTotpDebug.data.prototypeCode
                ? t('devLucasTotpPrototype', { code: lucasTotpDebug.data.prototypeCode })
                : t('devLucasTotpPrototypeOff')}
            </p>
          ) : null}
        </div>
      </div>
      <LoginDebugDialog state={debugDialog} />
    </>
  );
}
