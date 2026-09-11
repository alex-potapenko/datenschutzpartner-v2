'use client';

import type { ReactNode } from 'react';
import { useProfile } from '@/api/account';
import { cn } from '@/lib/utils';
import { NestedScreenShell } from '@/components/shared/NestedScreenShell';

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
  const profile = useProfile();
  const hasTopBar = Boolean(backHref && backLabel);
  const userDisplayName = profile.data?.displayName.trim();
  const resolvedDetailTitle =
    detailTitle ?? (showUserName && userDisplayName ? userDisplayName : undefined);

  if (!backHref || !backLabel) {
    return <>{children}</>;
  }

  return (
    <NestedScreenShell
      backHref={backHref}
      backLabel={backLabel}
      detailTitle={resolvedDetailTitle}
      showTopBar={hasTopBar}
      noPadding
    >
      {children}
    </NestedScreenShell>
  );
}
