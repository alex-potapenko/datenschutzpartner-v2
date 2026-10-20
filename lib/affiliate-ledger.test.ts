import { describe, expect, it } from 'vitest';
import {
  affiliateConversionRate,
  selectPayoutReferrals,
  sumCompletedPayoutsChf,
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

describe('sumCompletedPayoutsChf', () => {
  it('sums only transferred payouts (PRD A-31)', () => {
    expect(
      sumCompletedPayoutsChf([
        { amountChf: 40, status: 'transferred' },
        { amountChf: 16.91, status: 'invoice_requested' },
        { amountChf: 8.01, status: 'transferred' },
      ])
    ).toBe(48.01);
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
