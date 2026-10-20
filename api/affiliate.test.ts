import { beforeAll, describe, expect, it } from 'vitest';
import { calculateEuRepQuote } from './checkout';
import { ApiError, request } from './client';
import type { AffiliateApplication, AffiliateDashboard, AffiliateReferralLink } from './affiliate';
import { setAuthToken } from '@/lib/auth-session';

const PARTNER_EMAIL = 'lucas.baumgartner@gmail.com';
const PARTNER_SLUG = '356';
const PARTNER_TOKEN = `mock-email-${encodeURIComponent(PARTNER_EMAIL)}`;

function asPartner() {
  setAuthToken(PARTNER_TOKEN);
}

function post<T>(path: string, body: unknown = {}) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

async function dashboard() {
  asPartner();
  const data = await request<AffiliateDashboard | null>('/affiliate/dashboard/me');
  if (!data) throw new Error('approved partner missing');
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
 * Walks the partner-facing commission lifecycle: visit → pending referral → order paid (unpaid,
 * payable) → payout (paid + invoice request) → transferred. Admin steps happen in the external
 * admin tool; the prototype endpoints stand in for them.
 */
describe('affiliate contract', () => {
  beforeAll(async () => {
    asPartner();
    const application = await post<AffiliateApplication>('/affiliate/applications', {
      email: PARTNER_EMAIL,
      websiteUrl: 'https://baumgartner.ch',
      description: 'Ich empfehle Datenschutzpartner meinen Kunden.',
    });
    expect(application.status).toBe('pending');
    await post('/affiliate/prototype/simulate-approval-email');
  });

  it('serves a partner dashboard without customer identity', async () => {
    const data = await dashboard();
    expect(data.partner.slug).toBe(PARTNER_SLUG);
    expect(data.partner.referralUrl).toBe(`https://www.datenschutzpartner.ch/ref/${PARTNER_SLUG}/`);
    expect(data.referrals.length).toBeGreaterThan(0);
    expect(Object.keys(data.referrals[0] ?? {})).not.toContain('customerEmail');
    expect(data.stats.paidOutToDateChf).toBeGreaterThan(0);
    expect(data.payouts).toHaveLength(1);
    expect(data.vouchers).toHaveLength(2);
    expect(data.vouchers.map((row) => row.discountPercent).sort()).toEqual([10, 20]);
  });

  it('creates marketing links for same-site pages only', async () => {
    asPartner();
    const link = await post<AffiliateReferralLink>('/affiliate/partner/me/referral-links', {
      targetPath: 'datenschutzpartner.ch/eu-rep/questionnaire',
    });
    expect(link.targetPath).toBe('/eu-rep/questionnaire');
    expect(link.referralUrl).toBe(
      `https://www.datenschutzpartner.ch/fragebogen-eu-datenschutz-vertretung/ref/${PARTNER_SLUG}/`
    );

    expect(
      await statusOf(
        post('/affiliate/partner/me/referral-links', {
          targetPath: 'https://example.com/',
        })
      )
    ).toBe(400);
    expect(
      await statusOf(
        post('/affiliate/partner/me/referral-links', {
          targetPath: '/eu-rep/questionnaire',
        })
      )
    ).toBe(409);
  });

  it('records visits on the matching marketing link and returns a safe landing path', async () => {
    const result = await post<{ targetPath: string; attributed: boolean }>('/affiliate/clicks', {
      slug: PARTNER_SLUG,
      targetPath: '/eu-rep/questionnaire',
    });
    expect(result).toMatchObject({ targetPath: '/eu-rep/questionnaire', attributed: true });

    const unsafe = await post<{ targetPath: string }>('/affiliate/clicks', {
      slug: PARTNER_SLUG,
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
    const result = await post<{ commissionChf: number; commissionEmailSentTo: string | null }>(
      '/affiliate/prototype/mark-order-paid'
    );
    expect(result.commissionEmailSentTo).toBe(PARTNER_EMAIL);

    const after = await dashboard();
    expect(after.stats.unpaidEarningsChf).toBeCloseTo(
      before.stats.unpaidEarningsChf + result.commissionChf
    );
    expect(after.stats.pendingEarningsChf).toBeCloseTo(
      before.stats.pendingEarningsChf - result.commissionChf
    );
    expect(await statusOf(post('/affiliate/prototype/mark-order-paid'))).toBe(409);
  });

  it('settles unpaid referrals in a payout that is later marked transferred', async () => {
    const before = await dashboard();
    const payout = await post<{ amountChf: number; invoiceEmailSentTo: string }>(
      '/affiliate/prototype/create-payout'
    );
    expect(payout.amountChf).toBeCloseTo(before.stats.unpaidEarningsChf);
    expect(payout.invoiceEmailSentTo).toBe(PARTNER_EMAIL);
    expect(await statusOf(post('/affiliate/prototype/create-payout'))).toBe(409);

    const after = await dashboard();
    expect(after.stats.unpaidEarningsChf).toBe(0);
    expect(after.stats.paidOutToDateChf).toBeCloseTo(before.stats.paidOutToDateChf);
    expect(after.payouts[0]?.status).toBe('invoice_requested');

    await post('/affiliate/prototype/mark-transferred');
    const transferred = await dashboard();
    expect(transferred.stats.paidOutToDateChf).toBeCloseTo(
      before.stats.paidOutToDateChf + payout.amountChf
    );
    expect(transferred.payouts[0]?.status).toBe('transferred');
    expect(transferred.payouts[0]?.transferredAt).not.toBeNull();
    expect(await statusOf(post('/affiliate/prototype/mark-transferred'))).toBe(409);
  });

  it('stops attribution while the partner is deactivated and keeps the data', async () => {
    const before = await dashboard();
    expect((await post<{ status: string }>('/affiliate/prototype/toggle-active')).status).toBe(
      'inactive'
    );
    const click = await post<{ attributed: boolean }>('/affiliate/clicks', {
      slug: PARTNER_SLUG,
      targetPath: '/',
    });
    expect(click.attributed).toBe(false);
    const inactive = await dashboard();
    expect(inactive.partner.status).toBe('inactive');
    expect(inactive.stats.visits).toBe(before.stats.visits);
    expect(inactive.referrals).toHaveLength(before.referrals.length);

    await post('/affiliate/prototype/toggle-active');
    expect((await dashboard()).partner).toMatchObject({ status: 'active', deactivatedAt: null });
  });

  it('creates vouchers within the program maximum and applies them at checkout', async () => {
    asPartner();
    const voucher = await post<{ code: string; discountPercent: number }>(
      '/affiliate/partner/me/vouchers',
      { code: 'PARTNER10', discountPercent: 10 }
    );
    expect(voucher.code).toBe('PARTNER10');
    expect((await dashboard()).vouchers).toHaveLength(3);

    const validation = await post<{
      valid: boolean;
      normalizedCode?: string;
      discount?: { kind: string; rate: number };
    }>('/checkout/promo/validate', { code: 'partner10' });
    expect(validation.valid).toBe(true);
    expect(validation.normalizedCode).toBe('PARTNER10');
    expect(validation.discount).toEqual({ kind: 'percent', rate: 0.1 });

    const listPrice = calculateEuRepQuote('basis').amountDue;
    const session = await post<{ listPrice?: number; discountAmount?: number; amount: number }>(
      '/checkout/sessions',
      { kind: 'euRep', euRepPlanId: 'basis', euRepEntityCount: 1, promoCode: 'PARTNER10' }
    );
    expect(session.listPrice).toBeCloseTo(listPrice);
    expect(session.discountAmount).toBeCloseTo(listPrice * 0.1);
    expect(session.amount).toBeCloseTo(listPrice * 0.9);
  });

  it('returns 403 for partner mutations while deactivated', async () => {
    asPartner();
    await post('/affiliate/prototype/toggle-active');
    expect(
      await statusOf(post('/affiliate/partner/me/referral-links', { targetPath: '/test-inactive' }))
    ).toBe(403);
    expect(
      await statusOf(
        request('/affiliate/partner/me/slug', {
          method: 'PATCH',
          body: JSON.stringify({ slug: '999' }),
        })
      )
    ).toBe(403);
    await post('/affiliate/prototype/toggle-active');
  });

  it('deactivates on leave without deleting partner data', async () => {
    const before = await dashboard();
    await post('/affiliate/partner/me/leave');
    const after = await request<AffiliateDashboard | null>('/affiliate/dashboard/me');
    expect(after?.partner.status).toBe('inactive');
    expect(after?.referrals).toHaveLength(before.referrals.length);
    await post('/affiliate/prototype/toggle-active');
  });
});
