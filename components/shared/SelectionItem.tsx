'use client';

import type { ReactNode } from 'react';
import { Check, cn } from '@/components/ui';

/** Radio-style selectable row for billing pickers (payment method, address). */
export function SelectionItem({
  isSelected,
  onSelect,
  children,
  'aria-label': ariaLabel,
}: {
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={ariaLabel}
      onClick={onSelect}
      className={cn(
        'flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 text-left transition-[border-color,box-shadow,background-color]',
        isSelected
          ? 'border-accent bg-key-50 [box-shadow:inset_0_0_0_1px_var(--accent)]'
          : 'border-border hover:border-foreground/30'
      )}
    >
      <div className="min-w-0">{children}</div>
      <span
        aria-hidden
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border',
          isSelected ? 'border-accent bg-accent text-white' : 'border-border'
        )}
      >
        {isSelected ? <Check size={12} weight="bold" /> : null}
      </span>
    </button>
  );
}
