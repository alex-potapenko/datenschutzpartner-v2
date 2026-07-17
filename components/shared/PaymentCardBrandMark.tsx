import Image from 'next/image';
import { cn } from '@/components/ui';

/** ISO/IEC 7810 ID-1 — standard payment card aspect ratio (85.60 × 53.98 mm). */
export const PAYMENT_CARD_ASPECT_RATIO = '85.6 / 54';

/** Brand marks live in `public/payment-cards/{brand}.svg`. */
const CARD_BRAND_ASSETS = {
  visa: { src: '/payment-cards/visa.svg', alt: 'Visa' },
  mastercard: { src: '/payment-cards/mastercard.svg', alt: 'Mastercard' },
  maestro: { src: '/payment-cards/maestro.svg', alt: 'Maestro' },
} as const;

export type PaymentCardBrand = keyof typeof CARD_BRAND_ASSETS;

export function isPaymentCardBrand(value: string): value is PaymentCardBrand {
  return value in CARD_BRAND_ASSETS;
}

export function PaymentCardBrandMark({ brand, className }: { brand: string; className?: string }) {
  const normalized = brand.toLowerCase();

  if (!isPaymentCardBrand(normalized)) {
    return (
      <span
        className={cn(
          'border-border text-accent inline-flex w-8 shrink-0 items-center justify-center rounded-[4px] border bg-white px-0.5 text-[8px] font-bold tracking-wide uppercase',
          className
        )}
        style={{ aspectRatio: PAYMENT_CARD_ASPECT_RATIO }}
        aria-hidden
      >
        {brand}
      </span>
    );
  }

  const asset = CARD_BRAND_ASSETS[normalized];

  return (
    <span
      className={cn(
        'border-border relative inline-flex w-9 shrink-0 overflow-hidden rounded-[4px] border bg-white',
        className
      )}
      style={{ aspectRatio: PAYMENT_CARD_ASPECT_RATIO }}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        unoptimized
        sizes="36px"
        className="object-contain p-px"
      />
    </span>
  );
}
