'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { useProfile } from '@/api/account';
import { cn } from '@/lib/utils';
import { RegularPage } from '@/components/shared/RegularPage';

const DETAIL_TRANSITION = { duration: 0.24, ease: 'easeOut' } as const;

/** Page header for detail screens — title and actions below the TopBar back control. */
export function PolicyDetailScreenHeader({
  children,
  action,
  below,
  bordered = true,
}: {
  children?: ReactNode;
  action?: ReactNode;
  /** Content below the title row — e.g. section tabs inside the header. */
  below?: ReactNode;
  bordered?: boolean;
}) {
  return (
    <div className={bordered ? 'border-border shrink-0 border-b' : 'shrink-0'}>
      <div className={cn('flex flex-col px-4 sm:px-8', below ? 'gap-8 pt-8' : 'gap-6 py-8')}>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          {children ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
          ) : null}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {below}
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
  showUserName = false,
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  detailTitle?: string;
  /** Shows the signed-in member's full name next to the back control. */
  showUserName?: boolean;
}) {
  const router = useRouter();
  const profile = useProfile();
  const hasTopBar = Boolean(backHref && backLabel);
  const shouldReduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const userDisplayName = profile.data?.displayName?.trim();
  const resolvedDetailTitle =
    detailTitle ?? (showUserName && userDisplayName ? userDisplayName : undefined);

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
              detailTitle: resolvedDetailTitle,
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
