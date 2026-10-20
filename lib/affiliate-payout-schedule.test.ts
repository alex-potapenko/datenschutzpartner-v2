import { describe, expect, it } from 'vitest';
import { nextAffiliatePayoutDateIso } from './affiliate-payout-schedule';

describe('nextAffiliatePayoutDateIso', () => {
  it('returns the next quarter start when cadence is 3 months', () => {
    expect(nextAffiliatePayoutDateIso(new Date(2026, 1, 15), 3)).toBe('2026-04-01');
    expect(nextAffiliatePayoutDateIso(new Date(2026, 3, 1), 3)).toBe('2026-04-01');
    expect(nextAffiliatePayoutDateIso(new Date(2026, 3, 2), 3)).toBe('2026-07-01');
  });
});
