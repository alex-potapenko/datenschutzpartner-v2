'use client';

import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'motion/react';
import {
  formatDiscountPercent,
  GENERATOR_POLICY_UNIT_PRICE,
  type GeneratorPolicyQuote,
} from '@/api/checkout';
import { formatCheckoutChf } from '@/components/shared/ServiceCheckoutPlanCard';
import { VolumeDiscountNote } from '@/components/shared/VolumeDiscountDialog';
import { cn } from '@/lib/utils';

const NOTE_REVEAL_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export function shouldShowGeneratorPerSitePriceNote(quote: GeneratorPolicyQuote): boolean {
  return quote.siteCount > 1 || quote.discountRate > 0;
}

export function GeneratorPerSitePriceNote({
  quote,
  onOpenDiscountDialog,
  className,
  collapsedMarginClass = '-mt-2',
}: {
  quote: GeneratorPolicyQuote;
  onOpenDiscountDialog: () => void;
  className?: string;
  /** Cancels parent flex `gap` while the note is collapsed. Match parent gap (e.g. `-mt-3` for `gap-3`). */
  collapsedMarginClass?: string;
}) {
  const tp = useTranslations('generatorPage.pricingSection');
  const reduceMotion = useReducedMotion();
  const show = shouldShowGeneratorPerSitePriceNote(quote);
  const listPerSite = formatCheckoutChf(GENERATOR_POLICY_UNIT_PRICE);
  const discountedPerSite = formatCheckoutChf(quote.amountDue / quote.siteCount);

  const content =
    quote.discountRate > 0 ? (
      <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="text-muted line-through">{listPerSite}</span>
        <span className="text-foreground font-medium">{discountedPerSite}</span>
        <span className="inline-flex items-center gap-x-1.5 whitespace-nowrap">
          <span>{tp('perSiteUnit')}</span>
          <span aria-hidden>·</span>
          <VolumeDiscountNote
            label={tp('discountApplied', { percent: formatDiscountPercent(quote.discountRate) })}
            onOpen={onOpenDiscountDialog}
          />
        </span>
      </span>
    ) : (
      <span>{tp('perSite', { price: listPerSite })}</span>
    );

  return (
    <div
      className={cn(
        'grid min-h-0 motion-reduce:transition-none',
        show ? 'mt-0 grid-rows-[1fr]' : cn(collapsedMarginClass, 'grid-rows-[0fr]'),
        reduceMotion ? '' : 'transition-[grid-template-rows,margin-top] duration-300'
      )}
      style={reduceMotion ? undefined : { transitionTimingFunction: NOTE_REVEAL_EASE }}
      aria-hidden={!show}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            'motion-reduce:transition-none',
            show ? 'opacity-100' : 'pointer-events-none opacity-0',
            reduceMotion ? '' : 'transition-opacity duration-300',
            className ?? 'text-muted text-sm leading-snug'
          )}
          style={reduceMotion ? undefined : { transitionTimingFunction: NOTE_REVEAL_EASE }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
