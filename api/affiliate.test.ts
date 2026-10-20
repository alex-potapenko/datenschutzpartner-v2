import { describe, expect, it } from 'vitest';
import { ApiError, request } from './client';
import type {
  AffiliateAdminPayout,
  AffiliateAdminReferral,
  AffiliateDashboard,
  AffiliatePayoutPreview,
  AffiliateReferralLink,
} from './affiliate';
import { setAuthToken } from '@/lib/auth-session';

const PARTNER_TOKEN = `mock-email-${encodeURIComponent('karin@lichtweb.ch')}`;
const ADMIN_TOKEN = 'mock-token';

function asPartner() {
  setAuthToken(PARTNER_TOKEN);
}

function asAdmin() {
  setAuthToken(ADMIN_TOKEN);
}

function post<T>(path: string, body: unknown = {}) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

async function dashboard() {
  asPartner();
  const data = await request<AffiliateDashboard | null>('/affiliate/dashboard/me');
  if (!data) throw new Error('seeded partner missing');
  return data;
}

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 200;
  } catch (error) {
    return error instanceof ApiError ? error.status : 0;
  }
}

/**
 * Walks the commission lifecycle the backend has to implement: visit → pending referral →
 * order paid (unpaid, payable) → admin payout (paid + invoice-request email).
 */
describe('affiliate contract', () => {
  it('serves a partner dashboard without customer identity', async () => {
    const data = await dashboard();
    expect(data.partner.slug).toBe('lichtweb');
    expect(data.partner.referralUrl).toBe('https://datenschutzpartner.com/ref/lichtweb');
    expect(data.referrals.length).toBeGreaterThan(0);
    expect(Object.keys(data.referrals[0] ?? {})).not.toContain('customerEmail');
    expect(data.stats.paidEarningsChf).toBeGreaterThan(0);
    expect(data.payouts).toHaveLength(1);
  });

  it('creates marketing links for same-site pages only', async () => {
    asPartner();
    const link = await post<AffiliateReferralLink>('/affiliate/partner/me/referral-links', {
      targetPath: 'datenschutzpartner.ch/eu-rep/questionnaire',
      campaign: 'linkedin',
    });
    expect(link.targetPath).toBe('/eu-rep/questionnaire');
    expect(link.referralUrl).toBe(
      'https://datenschutzpartner.com/ref/lichtweb?to=%2Feu-rep%2Fquestionnaire&campaign=linkedin'
    );

    expect(
      await statusOf(
        post('/affiliate/partner/me/referral-links', {
          targetPath: 'https://example.com/',
          campaign: '',
        })
      )
    ).toBe(400);
    expect(
      await statusOf(
        post('/affiliate/partner/me/referral-links', {
          targetPath: '/eu-rep/questionnaire',
          campaign: 'linkedin',
        })
      )
    ).toBe(409);
  });

  it('records visits on the matching marketing link and returns a safe landing path', async () => {
    const result = await post<{ targetPath: string; attributed: boolean }>('/affiliate/clicks', {
      slug: 'lichtweb',
      targetPath: '/eu-rep/questionnaire',
      campaign: 'linkedin',
    });
    expect(result).toMatchObject({ targetPath: '/eu-rep/questionnaire', attributed: true });

    const unsafe = await post<{ targetPath: string }>('/affiliate/clicks', {
      slug: 'lichtweb',
      targetPath: '//evil.test',
    });
    expect(unsafe.targetPath).toBe('/');

    const link = (await dashboard()).referralLinks.find(
      (row) => row.targetPath === '/eu-rep/questionnaire'
    );
    expect(link?.clicks).toBe(1);
  });

  it('makes a commission payable only once the order is paid', async () => {
    const before = await dashboard();
    asAdmin();
    const pending = await request<AffiliateAdminReferral[]>(
      '/affiliate/admin/referrals?status=pending'
    );
    const target = pending.find((row) => row.partnerSlug === 'lichtweb');
    if (!target) throw new Error('seeded pending referral missing');

    const updated = await post<AffiliateAdminReferral>(
      `/affiliate/admin/referrals/${target.id}/mark-order-paid`
    );
    expect(updated.status).toBe('unpaid');
    expect(await statusOf(post(`/affiliate/admin/referrals/${target.id}/mark-order-paid`))).toBe(
      409
    );

    const after = await dashboard();
    expect(after.stats.unpaidEarningsChf).toBeCloseTo(
      before.stats.unpaidEarningsChf + target.commissionChf
    );
    expect(after.stats.pendingEarningsChf).toBeCloseTo(
      before.stats.pendingEarningsChf - target.commissionChf
    );
  });

  it('settles unpaid referrals in a payout and emails an invoice request', async () => {
    const before = await dashboard();
    asAdmin();
    const request_ = { partnerId: before.partner.id, periodStart: null, periodEnd: null };

    const preview = await post<AffiliatePayoutPreview>(
      '/affiliate/admin/payouts/preview',
      request_
    );
    expect(preview.amountChf).toBeCloseTo(before.stats.unpaidEarningsChf);
    expect(preview.referrals.every((row) => row.status === 'unpaid')).toBe(true);
    expect(preview.belowThreshold).toBe(preview.amountChf < preview.payoutThresholdChf);

    const payout = await post<AffiliateAdminPayout>('/affiliate/admin/payouts', request_);
    expect(payout.amountChf).toBeCloseTo(preview.amountChf);
    expect(payout.invoiceEmailSentTo).toBe('karin@lichtweb.ch');
    expect(payout.createdBy).toBe('admin@datenschutzpartner.ch');
    expect(await statusOf(post('/affiliate/admin/payouts', request_))).toBe(409);

    const after = await dashboard();
    expect(after.stats.unpaidEarningsChf).toBe(0);
    expect(after.stats.paidEarningsChf).toBeCloseTo(
      before.stats.paidEarningsChf + preview.amountChf
    );
    expect(after.payouts[0]?.id).toBe(payout.id);
  });

  it('keeps admin endpoints admin-only', async () => {
    asPartner();
    expect(await statusOf(request('/affiliate/admin/partners'))).toBe(403);
    expect(await statusOf(request('/affiliate/admin/payouts'))).toBe(403);
  });
});
