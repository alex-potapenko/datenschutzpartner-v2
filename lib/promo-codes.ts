function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export type PromoCodeDiscount =
  | { kind: 'percent'; rate: number }
  | { kind: 'fixed'; amount: number };

const PROMO_CODES: Record<string, PromoCodeDiscount> = {
  WELCOME10: { kind: 'percent', rate: 0.1 },
  EUREP50: { kind: 'fixed', amount: 50 },
};

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function resolvePromoCode(code: string): PromoCodeDiscount | null {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;
  return PROMO_CODES[normalized] ?? null;
}

export function applyPromoDiscount(amountExclVat: number, discount: PromoCodeDiscount): number {
  if (discount.kind === 'percent') {
    return roundMoney(amountExclVat * (1 - discount.rate));
  }
  return Math.max(0, roundMoney(amountExclVat - discount.amount));
}

export function calculatePromoDiscountAmount(
  amountExclVat: number,
  discount: PromoCodeDiscount
): number {
  return roundMoney(amountExclVat - applyPromoDiscount(amountExclVat, discount));
}
