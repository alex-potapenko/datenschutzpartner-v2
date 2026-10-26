'use client';

import type { ReactNode } from 'react';
import { InfoTooltip } from '@/components/shared/InfoTooltip';
import { cn } from '@/lib/utils';

type FormFieldLabelProps = {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  infoTooltip?: string;
  infoTooltipLabel?: string;
};

/** Label row for wizard form fields — optional info tooltip beside the caption. */
export function FormFieldLabel({
  htmlFor,
  children,
  className,
  infoTooltip,
  infoTooltipLabel,
}: FormFieldLabelProps) {
  const labelClassName = cn('text-foreground text-sm leading-snug font-medium', className);
  const tooltipLabel = infoTooltipLabel ?? (typeof children === 'string' ? children : undefined);

  return (
    <span className={cn('inline-flex items-center', infoTooltip && 'gap-1')}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClassName}>
          {children}
        </label>
      ) : (
        <span className={labelClassName}>{children}</span>
      )}
      {infoTooltip && tooltipLabel ? (
        <InfoTooltip label={tooltipLabel}>{infoTooltip}</InfoTooltip>
      ) : null}
    </span>
  );
}
