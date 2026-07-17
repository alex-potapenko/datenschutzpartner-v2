'use client';

import type { PaymentCardBrand } from '@/api/billing';
import { CreditCard } from '@/components/ui';
import { PaymentCardBrandMark } from '@/components/shared/PaymentCardBrandMark';
import { SelectionItem } from '@/components/shared/SelectionItem';

export function PaymentItem({
  isSelected,
  onSelect,
  title,
  subtitle,
  brand,
}: {
  isSelected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  brand?: PaymentCardBrand;
}) {
  return (
    <SelectionItem isSelected={isSelected} onSelect={onSelect} aria-label={title}>
      <div className="flex min-w-0 items-center gap-3">
        {brand ? (
          <PaymentCardBrandMark brand={brand} />
        ) : (
          <span className="border-border flex size-9 shrink-0 items-center justify-center rounded-[4px] border bg-white">
            <CreditCard size={16} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold">{title}</p>
          {subtitle ? <p className="text-muted text-xs">{subtitle}</p> : null}
        </div>
      </div>
    </SelectionItem>
  );
}
