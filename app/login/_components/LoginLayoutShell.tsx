'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { LoginForm } from './LoginForm';
import { LoginMagicLinkVerify } from './LoginMagicLinkVerify';
import { LoginDebugFooter } from './LoginDebugFooter';
import { LoginDevProvider } from './login-dev-context';
import { LoginRouteHeader } from './LoginRouteHeader';

const routeTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

/** Stable min-height avoids vertical jump while AnimatePresence (mode wait) swaps routes. */
const formStageMinHeightClass = 'min-h-[26rem] sm:min-h-[28rem]';

export function LoginLayoutShell() {
  const pathname = usePathname();
  const isForgotPassword = pathname.endsWith('/forgot-password');
  const isMagicLinkVerify = pathname.endsWith('/verify');
  const tLogin = useTranslations('login');
  const tForgot = useTranslations('forgotPassword');
  const tc = useTranslations('common');
  const reduceMotion = useReducedMotion();

  const motionTransition = {
    ...routeTransition,
    duration: reduceMotion ? 0 : routeTransition.duration,
  };

  const backHref = isForgotPassword || isMagicLinkVerify ? '/login' : '/';
  const backLabel = isForgotPassword || isMagicLinkVerify ? tForgot('backToLogin') : tc('backHome');
  const contentKey = isForgotPassword
    ? 'forgot-password'
    : isMagicLinkVerify
      ? 'magic-verify'
      : 'login';

  return (
    <LoginDevProvider>
      <main className="bg-background grid min-h-dvh grid-cols-1 lg:grid-cols-2">
        <div className="border-border order-2 flex min-h-dvh flex-col lg:order-1 lg:border-r">
          <div className="border-border shrink-0 border-b px-4 lg:px-8">
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <LoginRouteHeader backHref={backHref} backLabel={backLabel} />
            </div>
          </div>
          <div className="mt-48 flex flex-1 flex-col items-center justify-start px-4 pb-8 sm:mt-52 sm:pb-12 lg:px-8">
            <div
              className={`relative mx-auto grid w-full max-w-md grid-cols-1 ${formStageMinHeightClass} lg:mx-auto`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={contentKey}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={motionTransition}
                  className="col-start-1 row-start-1 flex w-full flex-col gap-6"
                >
                  {isForgotPassword ? (
                    <ForgotPasswordForm />
                  ) : isMagicLinkVerify ? (
                    <LoginMagicLinkVerify />
                  ) : (
                    <Suspense fallback={null}>
                      <LoginForm />
                    </Suspense>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <LoginDebugFooter />
        </div>

        <div
          role="img"
          aria-label={tLogin('panelImageAlt')}
          className="relative order-1 aspect-[4/3] w-full bg-cover bg-center sm:aspect-[16/10] lg:order-2 lg:aspect-auto lg:min-h-dvh"
          style={{ backgroundImage: "url('/login-panel.jpg')" }}
        />
      </main>
    </LoginDevProvider>
  );
}
