'use client';

import type { ReactNode } from 'react';
import { CheckCircle } from '@/components/ui';
import { cn } from '@/lib/utils';

type EuRepWizardCoveredSectionProps = {
  title: string;
  body?: ReactNode;
  children?: ReactNode;
  /** Full-page layout for the matched-contract shortcut. */
  variant?: 'section' | 'page' | 'nested';
};

export function EuRepWizardCoveredSection({
  title,
  body,
  children,
  variant = 'section',
}: EuRepWizardCoveredSectionProps) {
  const outerClassName =
    variant === 'page'
      ? 'flex h-full flex-1 flex-col px-4 pt-10 pb-10 sm:px-8 sm:pt-16'
      : variant === 'nested'
        ? undefined
        : 'px-4 py-4 sm:px-8 sm:py-6';

  const isNested = variant === 'nested';

  const inner = (
    <div
      className={cn('flex w-full flex-col items-start gap-6 text-left', !isNested && 'max-w-2xl')}
    >
      <div className="flex w-full flex-col gap-3">
        <div
          className={cn('flex w-full items-center gap-2', isNested ? 'flex-wrap' : 'flex-nowrap')}
        >
          <CheckCircle size={32} weight="fill" className="text-success shrink-0" aria-hidden />
          <h2
            className={cn(
              'text-foreground text-xl font-bold sm:text-2xl',
              !isNested && 'whitespace-nowrap'
            )}
          >
            {title}
          </h2>
        </div>
        {body ? <p className="text-foreground text-base leading-relaxed">{body}</p> : null}
      </div>
      {children}
    </div>
  );

  if (variant === 'nested') {
    return inner;
  }

  return <div className={outerClassName}>{inner}</div>;
}
