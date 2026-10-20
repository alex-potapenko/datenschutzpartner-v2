import { describe, expect, it } from 'vitest';
import {
  affiliateConversionRate,
  previousPayoutPeriod,
  selectPayoutReferrals,
  summarizeAffiliateReferrals,
  type AffiliateReferralStatus,
} from './affiliate-ledger';

function referral(status: AffiliateReferralStatus, commissionChf: number, createdAt: string) {
  return { status, commissionChf, createdAt };
}

const referrals = [
  referral('pending', 13.41, '2026-09-23T19:35:00Z'),
  referral('unpaid', 8.01, '2026-09-11T15:51:00Z'),
  referral('unpaid', 8.9, '2026-04-12T11:55:00Z'),
  referral('paid', 8.01, '2026-01-05T21:47:00Z'),
  referral('rejected', 13.41, '2026-03-28T21:26:00Z'),
];

describe('summarizeAffiliateReferrals', () => {
  it('splits earnings by lifecycle status and ignores rejected amounts', () => {
    const summary = summarizeAffiliateReferrals(referrals);
    expect(summary.counts).toEqual({ pending: 1, unpaid: 2, paid: 1, rejected: 1 });
    expect(summary.pendingChf).toBe(13.41);
    expect(summary.unpaidChf).toBe(16.91);
    expect(summary.paidChf).toBe(8.01);
  });
});

describe('affiliateConversionRate', () => {
  it('counts non-rejected referrals per visit', () => {
    expect(affiliateConversionRate(40, summarizeAffiliateReferrals(referrals))).toBe(0.1);
  });

  it('is zero without visits', () => {
    expect(affiliateConversionRate(0, summarizeAffiliateReferrals(referrals))).toBe(0);
  });
});

describe('selectPayoutReferrals', () => {
  it('settles only unpaid referrals inside the inclusive period', () => {
    const selected = selectPayoutReferrals(referrals, {
      periodStart: '2026-07-01',
      periodEnd: '2026-09-11',
    });
    expect(selected).toHaveLength(1);
    expect(selected[0]?.commissionChf).toBe(8.01);
  });

  it('treats missing bounds as open-ended', () => {
    expect(selectPayoutReferrals(referrals, { periodStart: null, periodEnd: null })).toHaveLength(
      2
    );
  });
});

describe('previousPayoutPeriod', () => {
  it('returns the full previous calendar quarter', () => {
    expect(previousPayoutPeriod(new Date('2026-10-20T10:00:00Z'), 3)).toEqual({
      periodStart: '2026-07-01',
      periodEnd: '2026-09-30',
    });
  });

  it('wraps into the previous year in January', () => {
    expect(previousPayoutPeriod(new Date('2026-01-15T10:00:00Z'), 3)).toEqual({
      periodStart: '2025-10-01',
      periodEnd: '2025-12-31',
    });
  });

  it('follows the configured cadence', () => {
    expect(previousPayoutPeriod(new Date('2026-10-20T10:00:00Z'), 1)).toEqual({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
    });
    expect(previousPayoutPeriod(new Date('2026-10-20T10:00:00Z'), 6)).toEqual({
      periodStart: '2026-01-01',
      periodEnd: '2026-06-30',
    });
  });
});
