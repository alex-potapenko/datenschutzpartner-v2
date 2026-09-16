'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { env } from '@/env';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { useOverlayState } from '@/components/ui';
import { LoginDebugDialog } from './LoginDebugDialog';
import { useLoginDev } from './login-dev-context';

export function LoginDebugFooter() {
  const t = useTranslations('login');
  const pathname = usePathname();
  const dev = useLoginDev();
  const debugDialog = useOverlayState();

  if (env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return null;
  }

  const isForgotPassword = pathname.endsWith('/forgot-password');
  const isMagicLinkVerify = pathname.endsWith('/verify');
  const showTrigger = !isForgotPassword && !isMagicLinkVerify && dev.step === 'email';

  if (!showTrigger) {
    return null;
  }

  return (
    <>
      <div className="mt-auto px-4 pb-4 lg:px-8">
        <div className="mx-auto flex w-full max-w-md justify-center lg:mx-0 lg:max-w-none">
          <NavigationLink
            size="sm"
            chevron="none"
            onPress={() => {
              debugDialog.open();
            }}
          >
            {t('devShowDebugInfo')}
          </NavigationLink>
        </div>
      </div>
      <LoginDebugDialog state={debugDialog} />
    </>
  );
}
