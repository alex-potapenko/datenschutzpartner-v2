import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/shared/Container';

export function ServiceCheckoutLayout({
  aside,
  children,
  centered = false,
  embedded = false,
  fillPlanColumn = true,
}: {
  aside?: ReactNode;
  children: ReactNode;
  /** Single-column checkout — center the plan card. */
  centered?: boolean;
  /** Skip outer Container and side borders — use inside an existing wizard column. */
  embedded?: boolean;
  /** Stretch plan column to match the form column height. */
  fillPlanColumn?: boolean;
}) {
  const planColumnClassName = cn(
    'border-border relative min-h-0 min-w-0 overflow-visible lg:border-l',
    aside && fillPlanColumn && 'self-stretch'
  );

  const layout = (
    <div
      className={cn(
        embedded
          ? 'grid h-full min-h-full grid-cols-1 items-stretch lg:grid-cols-2'
          : cn(
              'border-border grid grid-cols-1 items-stretch border-r border-l',
              aside ? 'lg:grid-cols-2' : centered ? 'justify-items-center' : 'lg:grid-cols-2'
            )
      )}
    >
      {aside ? (
        <div className="min-h-0 min-w-0 px-4 py-8 sm:px-8 sm:py-10 lg:py-12">{aside}</div>
      ) : null}
      <div className={cn(planColumnClassName)}>{children}</div>
    </div>
  );

  if (embedded) return layout;

  return <Container>{layout}</Container>;
}
