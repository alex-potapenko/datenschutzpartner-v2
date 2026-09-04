'use client';

import type { ReactNode } from 'react';
import { CheckCircle } from '@/components/ui';

type EuRepWizardCoveredSectionProps = {
  title: string;
  body?: string;
  children?: ReactNode;
  /** Full-page layout for the matched-contract shortcut. */
  variant?: 'section' | 'page';
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
      : 'px-4 py-4 sm:px-8 sm:py-6';

  return (
    <div className={outerClassName}>
      <div className="flex max-w-2xl flex-col items-start gap-6 text-left">
        <div className="flex flex-col gap-3">
          <div className="flex flex-nowrap items-center gap-2">
            <CheckCircle size={32} weight="fill" className="text-success shrink-0" aria-hidden />
            <h2 className="text-foreground text-xl font-bold whitespace-nowrap sm:text-2xl">
              {title}
            </h2>
          </div>
          {body ? <p className="text-foreground text-base leading-relaxed">{body}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
