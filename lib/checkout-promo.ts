import { normalizePromoCode, resolvePromoCode, type PromoCodeDiscount } from '@/lib/promo-codes';

export type AffiliateVoucherForCheckoutPromo = {
  code: string;
  discountPercent: number;
  partnerActive: boolean;
};

/**
 * Resolves static promo codes and active affiliate partner vouchers for checkout.
 * Server (MSW / backend) passes live voucher rows; the client validates via API.
 */
export function resolveCheckoutPromoCode(
  code: string,
  affiliateVouchers: AffiliateVoucherForCheckoutPromo[] = []
): PromoCodeDiscount | null {
  const staticDiscount = resolvePromoCode(code);
  if (staticDiscount) return staticDiscount;

  const normalized = normalizePromoCode(code);
  if (!normalized) return null;

  const voucher = affiliateVouchers.find((row) => row.code.toUpperCase() === normalized);
  if (!voucher?.partnerActive) return null;

  return { kind: 'percent', rate: voucher.discountPercent / 100 };
}
