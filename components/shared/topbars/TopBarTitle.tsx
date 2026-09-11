import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Service or screen title shown beside back/quit controls. */
export function TopBarTitle({
  children,
  lowercase = false,
  className,
}: {
  children: ReactNode;
  lowercase?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-display flex min-w-0 items-center truncate text-sm font-medium text-white',
        lowercase && 'leading-none tracking-tight lowercase',
        className
      )}
    >
      {children}
    </span>
  );
}
