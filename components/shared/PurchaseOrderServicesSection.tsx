'use client';

import { FileText, FlagBanner } from '@/components/ui';
import { formatCheckoutChf } from '@/components/shared/ServiceCheckoutPlanCard';

export type PurchaseOrderServiceLine = {
  product: 'policy' | 'euRep';
  title: string;
  detail: string;
  /** Annual amount excl. VAT — same basis as checkout breakdown. */
  amountExclVat: number;
};

const PRODUCT_ICON_STYLES: Record<
  PurchaseOrderServiceLine['product'],
  { background: string; color: string }
> = {
  policy: {
    background: 'color-mix(in oklab, var(--accent) 12%, transparent)',
    color: 'var(--accent)',
  },
  euRep: {
    background: 'color-mix(in oklab, var(--feature-indigo) 12%, transparent)',
    color: 'var(--feature-indigo)',
  },
};

/** "Your order" block — matches post-checkout confirmation screens. */
export function PurchaseOrderServicesSection({
  heading,
  lines,
  pricePeriodLabel,
}: {
  heading: string;
  lines: PurchaseOrderServiceLine[];
  pricePeriodLabel: string;
}) {
  if (lines.length === 0) return null;

  return (
    <section className="border-border overflow-hidden rounded-2xl border">
      <div className="border-border border-b px-5 py-4 sm:px-6">
        <p className="font-display text-foreground text-sm font-semibold">{heading}</p>
      </div>
      <div className="divide-border divide-y">
        {lines.map((line) => {
          const iconStyle = PRODUCT_ICON_STYLES[line.product];
          const Icon = line.product === 'policy' ? FileText : FlagBanner;

          return (
            <div
              key={`${line.product}-${line.title}-${line.detail}`}
              className="flex items-start gap-4 px-5 py-4 sm:px-6"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={iconStyle}
              >
                <Icon size={18} weight="fill" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-foreground text-sm font-semibold">{line.title}</p>
                  <p className="text-muted text-sm leading-relaxed">{line.detail}</p>
                </div>
                <div className="shrink-0 text-right whitespace-nowrap">
                  <p className="text-foreground text-sm font-semibold tabular-nums">
                    <span>{formatCheckoutChf(line.amountExclVat)}</span>
                    <span className="text-muted ml-1 text-xs font-normal">{pricePeriodLabel}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
