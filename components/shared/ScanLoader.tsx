'use client';

import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ScanPillBorderRing, ScanPillGlow } from '@/components/shared/scan-pill-visual';

const LEADING_SIZE = 24;
const PILL_PAD_LEFT = 24;
const PILL_PAD_RIGHT = 40;
const CONTENT_GAP = 12;

export type ScanLoaderLayout = 'pill' | 'center' | 'page';

export type ScanLoaderProps = {
  /** Status copy inside the scan pill (i18n). */
  label: string;
  /** Defaults to `label`. */
  statusAriaLabel?: string;
  /**
   * - `pill` — pill only (embed in custom layout)
   * - `center` — horizontally centered in a padded block (checkout panels, wizard rows)
   * - `page` — full viewport (account creation, route loading)
   */
  layout?: ScanLoaderLayout;
  className?: string;
  /** Leading slot; default is accent spinner (no search icon / sparks). */
  leading?: ReactNode;
};

function DefaultLeading() {
  return <Spinner size="sm" className="text-accent" aria-hidden />;
}

/** Rainbow scan pill — shared by URL scan UI and async status loaders. */
export function ScanLoaderPill({
  label,
  className,
  statusAriaLabel,
  leading = <DefaultLeading />,
}: Pick<ScanLoaderProps, 'label' | 'className' | 'statusAriaLabel' | 'leading'>) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [pillWidth, setPillWidth] = useState(480);

  useLayoutEffect(() => {
    const measuredText = measureRef.current?.getBoundingClientRect().width ?? 0;
    if (measuredText > 0) {
      setPillWidth(PILL_PAD_LEFT + LEADING_SIZE + CONTENT_GAP + measuredText + PILL_PAD_RIGHT);
    }
  }, [label]);

  return (
    <div
      className={cn('relative max-w-full', className)}
      style={{ width: pillWidth }}
      role="status"
      aria-live="polite"
      aria-label={statusAriaLabel ?? label}
    >
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute text-base font-semibold whitespace-nowrap sm:text-lg"
      >
        {label}
      </span>

      <ScanPillGlow active />

      <div
        className="relative z-10 flex h-20 items-center overflow-visible rounded-full bg-white py-3 pl-6"
        style={{ paddingRight: PILL_PAD_RIGHT }}
      >
        <ScanPillBorderRing active />
        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
          <div
            className="relative flex shrink-0 items-center justify-center"
            style={{ width: LEADING_SIZE, height: LEADING_SIZE }}
          >
            {leading}
          </div>
          <span className="text-accent relative z-10 min-w-0 text-base font-semibold whitespace-nowrap sm:text-lg">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Reusable async loader — scan-step visual language with spinner leading slot. */
export function ScanLoader({
  label,
  statusAriaLabel,
  layout = 'center',
  className,
  leading,
}: ScanLoaderProps) {
  const pill = (
    <ScanLoaderPill
      label={label}
      statusAriaLabel={statusAriaLabel}
      leading={leading}
      className={layout === 'pill' ? className : undefined}
    />
  );

  if (layout === 'pill') {
    return pill;
  }

  if (layout === 'page') {
    return (
      <main
        className={cn(
          'bg-background flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-8 sm:py-14',
          className
        )}
      >
        <div className="mx-auto flex w-full max-w-[640px] justify-center">{pill}</div>
      </main>
    );
  }

  return (
    <div className={cn('flex w-full items-center justify-center px-4 py-12 sm:px-8', className)}>
      {pill}
    </div>
  );
}
