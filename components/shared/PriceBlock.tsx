import { cn } from '@/lib/utils';
import { AnimatedRollingNumber } from '@/components/shared/AnimatedRollingNumber';

export type PriceBlockSize = 'default' | 'sm';

const PRICE_BLOCK_SIZES: Record<
  PriceBlockSize,
  { currencyClassName: string; amountClassName: string; noteClassName: string }
> = {
  default: {
    currencyClassName: 'font-display text-foreground pb-0.75 text-lg leading-none font-bold',
    amountClassName:
      'font-display text-foreground text-4xl leading-none font-bold tracking-tight whitespace-nowrap tabular-nums',
    noteClassName: 'text-muted text-sm leading-snug whitespace-nowrap',
  },
  sm: {
    currencyClassName: 'font-display text-foreground pb-0.5 text-sm leading-none font-bold',
    amountClassName:
      'font-display text-foreground text-2xl leading-none font-bold tracking-tight whitespace-nowrap tabular-nums',
    noteClassName: 'text-muted text-xs leading-snug whitespace-nowrap',
  },
};

export function priceBlockAmountClassName(size: PriceBlockSize = 'default') {
  return PRICE_BLOCK_SIZES[size].amountClassName;
}

export function priceBlockCurrencyClassName(size: PriceBlockSize = 'default') {
  return PRICE_BLOCK_SIZES[size].currencyClassName;
}

export function priceBlockNoteClassName(
  size: PriceBlockSize = 'default',
  tone: 'muted' | 'foreground' = 'muted'
) {
  const noteClassName = PRICE_BLOCK_SIZES[size].noteClassName;
  return tone === 'foreground'
    ? noteClassName.replace('text-muted', 'text-foreground')
    : noteClassName;
}

export type PriceBlockProps = {
  currency?: string;
  amount: string;
  animatedAmount?: number;
  notes?: Array<string | null | undefined>;
  align?: 'start' | 'center';
  size?: PriceBlockSize;
  className?: string;
};

export function PriceBlock({
  currency,
  amount,
  animatedAmount,
  notes,
  align = 'start',
  size = 'default',
  className,
}: PriceBlockProps) {
  const visibleNotes = (notes ?? []).filter((note): note is string => Boolean(note));
  const { currencyClassName, amountClassName, noteClassName } = PRICE_BLOCK_SIZES[size];

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        align === 'center' ? 'justify-center' : 'justify-start',
        size === 'sm' && 'gap-2',
        className
      )}
    >
      <p className="flex flex-nowrap items-end gap-2 whitespace-nowrap">
        {currency ? <span className={currencyClassName}>{currency}</span> : null}
        {animatedAmount !== undefined ? (
          <AnimatedRollingNumber value={animatedAmount} className={amountClassName} />
        ) : (
          <span className={amountClassName}>{amount}</span>
        )}
      </p>

      {visibleNotes.length > 0 ? (
        <div className="flex flex-col gap-0.5 text-left">
          {visibleNotes.map((note) => (
            <span key={note} className={noteClassName}>
              {note}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
