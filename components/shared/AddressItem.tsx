'use client';

import { MapPin } from '@/components/ui';
import { SelectionItem } from '@/components/shared/SelectionItem';

export function AddressItem({
  isSelected,
  onSelect,
  title,
  line,
  'aria-label': ariaLabel,
}: {
  isSelected: boolean;
  onSelect: () => void;
  title: string;
  line: string;
  'aria-label'?: string;
}) {
  return (
    <SelectionItem
      isSelected={isSelected}
      onSelect={onSelect}
      aria-label={ariaLabel ?? `${title}, ${line}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-full">
          <MapPin size={16} weight="fill" aria-hidden />
        </span>
        <address className="text-foreground min-w-0 truncate text-sm leading-snug not-italic">
          <span className="font-semibold">{title}</span>
          <br />
          <span className="text-muted">{line}</span>
        </address>
      </div>
    </SelectionItem>
  );
}
