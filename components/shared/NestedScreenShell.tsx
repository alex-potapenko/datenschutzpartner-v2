'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { RegularPage } from '@/components/shared/RegularPage';

const NESTED_SCREEN_TRANSITION = { duration: 0.24, ease: 'easeOut' } as const;

export { NESTED_SCREEN_TRANSITION };

type NestedScreenShellProps = {
  backHref: string;
  backLabel: string;
  detailTitle?: string;
  preferHref?: boolean;
  /** Renders below the top bar, above the animated body — same slot as RegularPage `header`. */
  pageHeader?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
  activePath?: string;
  showFooter?: boolean;
  noPadding?: boolean;
  showTopBar?: boolean;
  topBarVariant?: 'public' | 'account';
  trailing?: ReactNode;
};

/** Minimal nested route shell — icon back, optional service title, slide/fade enter and exit. */
export function NestedScreenShell({
  backHref,
  backLabel,
  detailTitle,
  preferHref = true,
  pageHeader,
  contentClassName,
  children,
  activePath,
  showFooter = false,
  noPadding = false,
  showTopBar = true,
  topBarVariant,
  trailing,
}: NestedScreenShellProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);

  const handleBack = useCallback(() => {
    if (shouldReduceMotion) {
      router.push(backHref);
      return;
    }

    setIsExiting(true);
  }, [backHref, router, shouldReduceMotion]);

  const bodyClassName =
    contentClassName ??
    (noPadding
      ? 'flex flex-1 flex-col'
      : `flex flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 ${!pageHeader ? 'pt-20' : ''}`);

  return (
    <RegularPage
      activePath={activePath}
      showFooter={showFooter}
      noPadding
      trailing={trailing}
      showTopBar={showTopBar}
      topBarVariant={topBarVariant}
      minimal
      backLink={{
        href: backHref,
        label: backLabel,
        preferHref,
        iconOnly: true,
        detailTitle,
        onPress: handleBack,
      }}
    >
      <motion.div
        className="flex min-h-dvh flex-1 flex-col"
        initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
        animate={isExiting ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
        transition={NESTED_SCREEN_TRANSITION}
        onAnimationComplete={() => {
          if (isExiting) {
            router.push(backHref);
          }
        }}
      >
        {pageHeader ? (
          <>
            <div className="flex flex-col gap-6 px-4 pt-20 pb-10 sm:px-8">{pageHeader}</div>
            <div
              aria-hidden
              className="border-border relative left-1/2 w-screen -translate-x-1/2 border-b"
            />
          </>
        ) : null}
        <div className={bodyClassName}>{children}</div>
      </motion.div>
    </RegularPage>
  );
}
