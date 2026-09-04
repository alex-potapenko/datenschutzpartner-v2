import { describe, expect, it } from 'vitest';
import { calculateActivationOrderPricing } from './activation-order-pricing';

describe('calculateActivationOrderPricing', () => {
  it('prices a new policy without volume discount for guests', () => {
    const pricing = calculateActivationOrderPricing({ done: true }, {});

    expect(pricing).toMatchObject({
      withEuRep: false,
      policyAmount: 89,
      euRepAmount: 0,
    });
  });

  it('shows the final policy price when a volume tier applies', () => {
    const pricing = calculateActivationOrderPricing({ done: true }, { activePolicySiteCount: 3 });

    expect(pricing.policyAmount).toBe(84.55);
    expect(pricing.euRepAmount).toBe(0);
  });

  it('includes EU Rep when a plan was chosen', () => {
    const pricing = calculateActivationOrderPricing(
      { plan: 'basis', done: true },
      { activePolicySiteCount: 0 }
    );

    expect(pricing).toMatchObject({
      withEuRep: true,
      policyAmount: 89,
      euRepAmount: 149,
    });
  });

  it('does not charge for a prepaid fill slot', () => {
    const pricing = calculateActivationOrderPricing(
      { done: true },
      { fillSubscriptionId: '86104' }
    );

    expect(pricing).toMatchObject({
      isFillSlot: true,
      policyAmount: 0,
    });
  });
});
