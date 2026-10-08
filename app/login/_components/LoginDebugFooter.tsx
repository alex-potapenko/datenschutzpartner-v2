'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { env } from '@/env';
import { readPrototypeMagicLoginUrl } from '@/lib/magic-login-prototype';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { useOverlayState } from '@/components/ui';
import { LoginDebugDialog } from './LoginDebugDialog';
import { useLoginDev } from './login-dev-context';

export function LoginDebugFooter() {
  const t = useTranslations('login');
  const pathname = usePathname();
  const router = useRouter();
  const dev = useLoginDev();
  const debugDialog = useOverlayState();

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

  if (!showDebugInfo && !showMagicLink) {
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
          ) : (
            <NavigationLink size="sm" chevron="right" onPress={openPrototypeMagicLink}>
              {t('devAdminMagicLink')}
            </NavigationLink>
          )}
        </div>
      </div>
      <LoginDebugDialog state={debugDialog} />
    </>
  );
}
