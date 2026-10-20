/**
 * Commission lifecycle: `pending` (order not paid) → `unpaid` (payable) → `paid` (in a payout).
 * `rejected` never counts towards earnings.
 */
export const AFFILIATE_REFERRAL_STATUSES = ['pending', 'unpaid', 'paid', 'rejected'] as const;

export type AffiliateReferralStatus = (typeof AFFILIATE_REFERRAL_STATUSES)[number];

type LedgerReferral = {
  status: AffiliateReferralStatus;
  commissionChf: number;
  createdAt: string;
};

export type AffiliateReferralSummary = {
  counts: Record<AffiliateReferralStatus, number>;
  pendingChf: number;
  unpaidChf: number;
  paidChf: number;
};

export const AFFILIATE_PAYOUT_COMPLETED_STATUS = 'transferred' as const;

type CompletedPayoutRow = {
  amountChf: number;
  status: typeof AFFILIATE_PAYOUT_COMPLETED_STATUS | 'invoice_requested';
};

/** PRD A-31: sum of completed (transferred) payouts — not referral `paid` commission totals. */
export function sumCompletedPayoutsChf(payouts: readonly CompletedPayoutRow[]) {
  return roundChf(
    payouts
      .filter((row) => row.status === AFFILIATE_PAYOUT_COMPLETED_STATUS)
      .reduce((sum, row) => sum + row.amountChf, 0)
  );
}

export function roundChf(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function summarizeAffiliateReferrals(
  referrals: readonly LedgerReferral[]
): AffiliateReferralSummary {
  const counts: Record<AffiliateReferralStatus, number> = {
    pending: 0,
    unpaid: 0,
    paid: 0,
    rejected: 0,
  };
  const totals: Record<AffiliateReferralStatus, number> = {
    pending: 0,
    unpaid: 0,
    paid: 0,
    rejected: 0,
  };
  for (const row of referrals) {
    counts[row.status] += 1;
    totals[row.status] += row.commissionChf;
  }
  return {
    counts,
    pendingChf: roundChf(totals.pending),
    unpaidChf: roundChf(totals.unpaid),
    paidChf: roundChf(totals.paid),
  };
}

/** Share of visits that led to a non-rejected referral (0–1). */
export function affiliateConversionRate(visits: number, summary: AffiliateReferralSummary) {
  if (visits <= 0) return 0;
  const converted = summary.counts.pending + summary.counts.unpaid + summary.counts.paid;
  return Math.min(1, converted / visits);
}

/** Inclusive `YYYY-MM-DD` bounds; a missing bound is open-ended. */
export type AffiliatePayoutPeriod = {
  periodStart: string | null;
  periodEnd: string | null;
};

export function isWithinPayoutPeriod(createdAt: string, period: AffiliatePayoutPeriod) {
  const day = createdAt.slice(0, 10);
  if (period.periodStart && day < period.periodStart) return false;
  if (period.periodEnd && day > period.periodEnd) return false;
  return true;
}

/** Payable referrals a payout run would settle. */
export function selectPayoutReferrals<T extends LedgerReferral>(
  referrals: readonly T[],
  period: AffiliatePayoutPeriod
): T[] {
  return referrals.filter(
    (row) => row.status === 'unpaid' && isWithinPayoutPeriod(row.createdAt, period)
  );
}
