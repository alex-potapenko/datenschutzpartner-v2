'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useWizardColumnMinHeight } from './useWizardColumnMinHeight';

type WizardBorderedColumnProps = {
  children: ReactNode;
  className?: string;
  /** Changing UI state — refreshes min-height when conditional blocks open/close. */
  layoutKey?: unknown;
};

export function WizardBorderedColumn({
  children,
  className,
  layoutKey,
}: WizardBorderedColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  useWizardColumnMinHeight(ref, [layoutKey]);

  return (
    <div ref={ref} className={cn('border-border flex min-h-0 flex-1 flex-col border-x', className)}>
      {children}
    </div>
  );
}
