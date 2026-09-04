'use client';

import { MagnifyingGlass } from '@/components/ui';
import { cn } from '@/lib/utils';

type ListSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
};

/** Lightweight search field for list / dropdown chrome — not a HeroUI input. */
export function ListSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: ListSearchInputProps) {
  return (
    <div className={cn('border-border flex items-center gap-2 border-t px-4 py-3', className)}>
      <MagnifyingGlass size={16} weight="bold" className="text-muted shrink-0" aria-hidden />
      <input
        type="text"
        role="searchbox"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="text-foreground placeholder:text-muted min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none"
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
      />
    </div>
  );
}
