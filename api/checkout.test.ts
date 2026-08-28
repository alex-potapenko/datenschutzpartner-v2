import { describe, expect, it } from 'vitest';
import {
  GENERATOR_POLICY_UNIT_PRICE,
  calculateAmountInclVat,
  calculateGeneratorPolicyQuote,
  calculateEuRepQuote,
  calculateVatAmount,
  EU_REP_UNIT_PRICE,
  formatDiscountPercent,
  generatorVolumeDiscountExplanation,
  generatorVolumeDiscountRate,
  qualifyingSiteCountForCheckout,
} from './checkout';

describe('generatorVolumeDiscountRate', () => {
  it('gives no discount at 3 active sites or fewer', () => {
    expect(generatorVolumeDiscountRate(0)).toBe(0);
    expect(generatorVolumeDiscountRate(3)).toBe(0);
  });

  it('gives 5% from 4 active sites', () => {
    expect(generatorVolumeDiscountRate(4)).toBe(0.05);
    expect(generatorVolumeDiscountRate(5)).toBe(0.05);
  });

  it('gives 7.5% from 6 active sites', () => {
    expect(generatorVolumeDiscountRate(6)).toBe(0.075);
    expect(generatorVolumeDiscountRate(8)).toBe(0.075);
    expect(generatorVolumeDiscountRate(10)).toBe(0.075);
  });

  it('gives 10% from 11 active sites', () => {
    expect(generatorVolumeDiscountRate(11)).toBe(0.1);
    expect(generatorVolumeDiscountRate(14)).toBe(0.1);
  });
});

describe('generatorVolumeDiscountExplanation', () => {
  it('is empty below the first paid tier', () => {
    expect(generatorVolumeDiscountExplanation(3)).toBeNull();
  });

  it('uses the matched tier threshold, not the current count', () => {
    expect(generatorVolumeDiscountExplanation(4)).toEqual({
      minSites: 4,
      percent: '5',
    });
    expect(generatorVolumeDiscountExplanation(5)).toEqual({
      minSites: 4,
      percent: '5',
    });
    expect(generatorVolumeDiscountExplanation(8)).toEqual({
      minSites: 6,
      percent: '7.5',
    });
    expect(generatorVolumeDiscountExplanation(12)).toEqual({
      minSites: 11,
      percent: '10',
    });
  });
});

describe('calculateGeneratorPolicyQuote', () => {
  it('prices a first order of 3 sites at full unit price', () => {
    const quote = calculateGeneratorPolicyQuote(3, 3);

    expect(quote.siteCount).toBe(3);
    expect(quote.discountRate).toBe(0);
    expect(quote.listPrice).toBe(3 * GENERATOR_POLICY_UNIT_PRICE);
    expect(quote.amountDue).toBe(3 * GENERATOR_POLICY_UNIT_PRICE);
  });

  it('applies 5% when 4 sites are already active before the order', () => {
    const quote = calculateGeneratorPolicyQuote(4, 1);

    expect(quote.qualifyingSiteCount).toBe(4);
    expect(quote.discountRate).toBe(0.05);
    expect(quote.amountDue).toBe(roundish(GENERATOR_POLICY_UNIT_PRICE * 0.95));
  });

  it('applies the next tier when this order itself crosses the threshold', () => {
    const qualifying = qualifyingSiteCountForCheckout(3, 'generator', 1);
    const quote = calculateGeneratorPolicyQuote(qualifying, 1);

    expect(qualifying).toBe(4);
    expect(quote.discountRate).toBe(0.05);
    expect(quote.amountDue).toBe(roundish(GENERATOR_POLICY_UNIT_PRICE * 0.95));
  });

  it('applies 7.5% when 3 active sites and the cart reaches 6', () => {
    const qualifying = qualifyingSiteCountForCheckout(3, 'generator', 3);
    const quote = calculateGeneratorPolicyQuote(qualifying, 3);

    expect(qualifying).toBe(6);
    expect(quote.discountRate).toBe(0.075);
  });

  it('does not add the cart to the qualifying count on renewal', () => {
    expect(qualifyingSiteCountForCheckout(3, 'generatorRenewal', 3)).toBe(3);
  });

  it('applies 7.5% to a 5-site renewal when 8 sites are already active', () => {
    const quote = calculateGeneratorPolicyQuote(8, 5);

    expect(quote.discountRate).toBe(0.075);
    expect(quote.listPrice).toBe(5 * GENERATOR_POLICY_UNIT_PRICE);
    expect(quote.discountAmount).toBe(roundish(5 * GENERATOR_POLICY_UNIT_PRICE * 0.075));
    expect(quote.amountDue).toBe(
      5 * GENERATOR_POLICY_UNIT_PRICE - roundish(5 * GENERATOR_POLICY_UNIT_PRICE * 0.075)
    );
  });

  it('applies one rate to every site on a 3-site renewal at 8 active sites', () => {
    const quote = calculateGeneratorPolicyQuote(8, 3);

    expect(quote.qualifyingSiteCount).toBe(8);
    expect(quote.discountRate).toBe(0.075);
    expect(quote.amountDue).toBe(
      3 * GENERATOR_POLICY_UNIT_PRICE - roundish(3 * GENERATOR_POLICY_UNIT_PRICE * 0.075)
    );
  });
});

describe('formatDiscountPercent', () => {
  it('formats 7.5% without trailing float noise', () => {
    expect(formatDiscountPercent(0.075)).toBe('7.5');
    expect(formatDiscountPercent(0.05)).toBe('5');
    expect(formatDiscountPercent(0.1)).toBe('10');
  });
});

describe('calculateEuRepQuote', () => {
  it('prices one legal entity at the unit price', () => {
    expect(calculateEuRepQuote(1).amountDue).toBe(EU_REP_UNIT_PRICE);
  });

  it('caps entity count at one per checkout', () => {
    expect(calculateEuRepQuote(2).amountDue).toBe(EU_REP_UNIT_PRICE);
    expect(calculateEuRepQuote(2).entityCount).toBe(1);
  });
});

describe('vat helpers', () => {
  it('calculates Swiss VAT on excl. amounts', () => {
    expect(calculateVatAmount(100)).toBe(8.1);
    expect(calculateAmountInclVat(100)).toBe(108.1);
  });
});

function roundish(value: number): number {
  return Math.round(value * 100) / 100;
}
