import { describe, expect, it } from 'vitest';
import { hasActivePolicyTrial, isPolicySubscriptionOnTrial, type Subscription } from './billing';

function policy(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: '1',
    productType: 'policy',
    product: 'Privacy Policy',
    status: 'active',
    startDate: '2026-08-01',
    lastOrderDate: '2026-08-01',
    nextPaymentDate: '2026-09-10',
    totals: { product: 'Privacy Policy', subtotal: 0, discount: 0, total: 0, currency: 'CHF' },
    relatedOrderIds: [],
    ...overrides,
  };
}

describe('hasActivePolicyTrial', () => {
  it('is true while trialEndsAt is today or later', () => {
    expect(
      hasActivePolicyTrial([policy({ trialEndsAt: '2026-08-31' })], new Date('2026-08-31T10:00:00'))
    ).toBe(true);
  });

  it('is false when the trial date has passed', () => {
    expect(
      hasActivePolicyTrial([policy({ trialEndsAt: '2026-08-30' })], new Date('2026-08-31T10:00:00'))
    ).toBe(false);
  });

  it('is false for paid subscriptions without a trial', () => {
    expect(hasActivePolicyTrial([policy()], new Date('2026-08-31T10:00:00'))).toBe(false);
  });
});

describe('isPolicySubscriptionOnTrial', () => {
  it('is true for an active policy subscription within the trial window', () => {
    expect(
      isPolicySubscriptionOnTrial(
        policy({ trialEndsAt: '2026-09-14' }),
        new Date('2026-08-31T10:00:00')
      )
    ).toBe(true);
  });

  it('is false once the trial has ended', () => {
    expect(
      isPolicySubscriptionOnTrial(
        policy({ trialEndsAt: '2026-08-30' }),
        new Date('2026-08-31T10:00:00')
      )
    ).toBe(false);
  });
});
