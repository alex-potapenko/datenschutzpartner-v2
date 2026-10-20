import { describe, expect, it } from 'vitest';
import { resolveCheckoutPromoCode } from './checkout-promo';

describe('resolveCheckoutPromoCode', () => {
  it('resolves static promo codes', () => {
    expect(resolveCheckoutPromoCode('welcome10', [])).toEqual({ kind: 'percent', rate: 0.1 });
  });

  it('resolves an active affiliate voucher', () => {
    expect(
      resolveCheckoutPromoCode('lucas20', [
        { code: 'LUCAS20', discountPercent: 20, partnerActive: true },
      ])
    ).toEqual({ kind: 'percent', rate: 0.2 });
  });

  it('ignores vouchers from inactive partners', () => {
    expect(
      resolveCheckoutPromoCode('lucas20', [
        { code: 'LUCAS20', discountPercent: 20, partnerActive: false },
      ])
    ).toBeNull();
  });

  it('returns null for unknown codes', () => {
    expect(resolveCheckoutPromoCode('nope', [])).toBeNull();
  });
});
