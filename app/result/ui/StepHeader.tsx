import React from 'react';
import { CheckCircle } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { cn } from '@/lib/utils';

interface StepHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Green success check before the title — e.g. policy ready, already covered. */
  showSuccessCheck?: boolean;
  /** Side borders on the inner column — off when a parent wraps header and body. */
  sideBorders?: boolean;
  /** Wrap in Container. Off when a parent already provides the column. */
  contained?: boolean;
  /** Bottom rule under the title. Off when a parent uses divide-y. */
  bottomBorder?: boolean;
}

export function StepHeader({
  title,
  description,
  showSuccessCheck = false,
  sideBorders = true,
  contained = true,
  bottomBorder = true,
}: StepHeaderProps) {
  const inner = (
    <div
      className={cn(
        'border-border flex flex-col gap-3 px-4 pt-10 pb-8 sm:px-8 sm:pt-16 sm:pb-10',
        sideBorders && 'border-r border-l'
      )}
    >
      <div className="flex items-center gap-2">
        {showSuccessCheck ? (
          <CheckCircle size={32} weight="fill" className="text-success shrink-0" aria-hidden />
        ) : null}
        <h1 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">{title}</h1>
      </div>
      {description ? (
        <div className="text-foreground flex flex-col gap-3 text-base leading-relaxed">
          {description}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={cn(bottomBorder && 'border-border border-b')}>
      {contained ? <Container>{inner}</Container> : inner}
    </div>
  );
}
