'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { RegularPage } from '@/components/shared/RegularPage';

const DETAIL_TRANSITION = { duration: 0.24, ease: 'easeOut' } as const;

/** Page header for detail screens — title and actions below the TopBar back control. */
export function PolicyDetailScreenHeader({
  children,
  action,
  bordered = true,
}: {
  children?: ReactNode;
  action?: ReactNode;
  bordered?: boolean;
}) {
  return (
    <div className={bordered ? 'border-border shrink-0 border-b' : 'shrink-0'}>
      <div className="flex flex-col gap-8 px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          {children ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
          ) : null}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** Shared shell for account detail routes — TopBar with icon-only back and "{entity} details". */
export function PolicyDetailPageShell({
  children,
  backHref,
  backLabel,
  detailTitle,
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  detailTitle?: string;
}) {
  const router = useRouter();
  const hasTopBar = Boolean(backHref && backLabel);
  const shouldReduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);

  const handleBack = useCallback(() => {
    if (!backHref) return;

    if (shouldReduceMotion) {
      router.push(backHref);
      return;
    }

    setIsExiting(true);
  }, [backHref, router, shouldReduceMotion]);

  return (
    <RegularPage
      showFooter={false}
      noPadding
      showTopBar={hasTopBar}
      minimal
      backLink={
        backHref && backLabel
          ? {
              href: backHref,
              label: backLabel,
              preferHref: true,
              iconOnly: true,
              detailTitle,
              onPress: handleBack,
            }
          : undefined
      }
    >
      <motion.div
        className="flex min-h-dvh flex-1 flex-col"
        initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
        animate={isExiting ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
        transition={DETAIL_TRANSITION}
        onAnimationComplete={() => {
          if (isExiting && backHref) {
            router.push(backHref);
          }
        }}
      >
        {children}
      </motion.div>
    </RegularPage>
  );
}
