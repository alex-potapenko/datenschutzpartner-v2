import { describe, expect, it } from 'vitest';
import {
  applyPromoDiscount,
  calculatePromoDiscountAmount,
  normalizePromoCode,
  resolvePromoCode,
} from './promo-codes';

describe('promo-codes', () => {
  it('normalizes codes', () => {
    expect(normalizePromoCode(' welcome10 ')).toBe('WELCOME10');
  });

  it('resolves known codes', () => {
    expect(resolvePromoCode('welcome10')).toEqual({ kind: 'percent', rate: 0.1 });
    expect(resolvePromoCode('unknown')).toBeNull();
  });

  it('applies percent and fixed discounts', () => {
    expect(applyPromoDiscount(149, { kind: 'percent', rate: 0.1 })).toBe(134.1);
    expect(applyPromoDiscount(149, { kind: 'fixed', amount: 50 })).toBe(99);
    expect(calculatePromoDiscountAmount(149, { kind: 'fixed', amount: 50 })).toBe(50);
  });
});
