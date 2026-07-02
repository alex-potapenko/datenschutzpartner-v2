import { cn } from '@/lib/utils';

export type PriceBlockProps = {
  currency: string;
  amount: string;
  notes?: Array<string | null | undefined>;
  align?: 'start' | 'center';
  className?: string;
};

export function PriceBlock({
  currency,
  amount,
  notes,
  align = 'start',
  className,
}: PriceBlockProps) {
  const visibleNotes = (notes ?? []).filter((note): note is string => Boolean(note));

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        align === 'center' ? 'justify-center' : 'justify-start',
        className
      )}
    >
      <p className="flex flex-nowrap items-end gap-2 whitespace-nowrap">
        <span className="font-display text-foreground pb-0.75 text-lg leading-none font-bold">
          {currency}
        </span>
        <span className="font-display text-foreground text-4xl leading-none font-bold tracking-tight whitespace-nowrap tabular-nums">
          {amount}
        </span>
      </p>

      {visibleNotes.length > 0 ? (
        <div className="flex flex-col gap-0.5 text-left">
          {visibleNotes.map((note) => (
            <span key={note} className="text-muted text-sm leading-snug whitespace-nowrap">
              {note}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
