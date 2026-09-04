'use client';

import type { ReactNode } from 'react';
import { CaretUpDown, cn } from '@/components/ui';

export type ListSelectorTriggerVariant = 'sidebar' | 'topbar';

const VARIANT_CLASS: Record<ListSelectorTriggerVariant, string> = {
  sidebar:
    'py-5 pr-3 pl-5 text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]',
  topbar: 'rounded-full border border-white/20 px-4 py-1.5 text-white hover:bg-white/10',
};

export function ListSelectorTrigger({
  label,
  ariaLabel,
  variant = 'sidebar',
  className,
  icon,
  leadingIcon,
  isExpanded,
  onPress,
}: {
  label: string;
  ariaLabel: string;
  variant?: ListSelectorTriggerVariant;
  className?: string;
  icon?: ReactNode;
  leadingIcon?: ReactNode;
  isExpanded?: boolean;
  onPress?: () => void;
}) {
  const isTopBar = variant === 'topbar';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={isExpanded}
      onClick={onPress}
      className={cn(
        'list-selector-trigger flex h-auto w-full min-w-0 cursor-pointer items-center border-0 bg-transparent text-left font-semibold transition-colors outline-none',
        leadingIcon ? 'gap-3' : 'gap-2',
        VARIANT_CLASS[variant],
        className
      )}
    >
      {leadingIcon}
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          isTopBar ? 'font-display text-sm font-medium' : 'text-accent font-sans text-base'
        )}
      >
        {label}
      </span>
      {icon ?? (
        <CaretUpDown
          size={isTopBar ? 14 : 18}
          className={cn('shrink-0', isTopBar ? 'text-white/70' : 'text-muted')}
          aria-hidden
        />
      )}
    </button>
  );
}
