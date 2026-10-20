import { beforeAll, describe, expect, it } from 'vitest';
import { ApiError, request } from './client';
import type {
  AffiliateAdminPartner,
  AffiliateAdminPayout,
  AffiliateAdminReferral,
  AffiliateApplication,
  AffiliateCampaignStats,
  AffiliateDashboard,
  AffiliatePayoutPreview,
  AffiliateReferralLink,
} from './affiliate';
import { setAuthToken } from '@/lib/auth-session';

const PARTNER_EMAIL = 'lucas.baumgartner@gmail.com';
const PARTNER_SLUG = 'lucas.baumgartner';
const PARTNER_TOKEN = `mock-email-${encodeURIComponent(PARTNER_EMAIL)}`;
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
 * Walks the commission lifecycle the backend has to implement: visit → pending referral →
 * order paid (unpaid, payable) → admin payout (paid + invoice-request email).
 */
describe('affiliate contract', () => {
  beforeAll(async () => {
    asPartner();
    const application = await post<AffiliateApplication>('/affiliate/applications', {
      email: PARTNER_EMAIL,
      websiteUrl: 'https://baumgartner.ch',
      description: 'Ich empfehle Datenschutzpartner meinen Kunden.',
    });
    asAdmin();
    await post(`/affiliate/admin/applications/${application.id}/approve`);
  });

  it('serves a partner dashboard without customer identity', async () => {
    const data = await dashboard();
    expect(data.partner.slug).toBe(PARTNER_SLUG);
    expect(data.partner.referralUrl).toBe(`https://datenschutzpartner.com/ref/${PARTNER_SLUG}`);
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
      `https://datenschutzpartner.com/ref/${PARTNER_SLUG}?to=/eu-rep/questionnaire&campaign=linkedin`
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
      slug: PARTNER_SLUG,
      targetPath: '/eu-rep/questionnaire',
      campaign: 'linkedin',
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

  it('aggregates visits and referrals per campaign', async () => {
    asPartner();
    const stats = await request<AffiliateCampaignStats[]>('/affiliate/partner/me/campaigns');
    const newsletter = stats.find((row) => row.campaign === 'newsletter');
    expect(newsletter?.visits).toBeGreaterThan(0);
    expect(newsletter?.referrals).toBeGreaterThan(0);
    expect(newsletter?.conversionRate).toBeCloseTo(
      (newsletter?.referrals ?? 0) / (newsletter?.visits ?? 1)
    );
    const totalVisits = stats.reduce((sum, row) => sum + row.visits, 0);
    const visits = await request<unknown[]>('/affiliate/partner/me/visits');
    expect(totalVisits).toBe(visits.length);
  });

  it('makes a commission payable only once the order is paid', async () => {
    const before = await dashboard();
    asAdmin();
    const pending = await request<AffiliateAdminReferral[]>(
      '/affiliate/admin/referrals?status=pending'
    );
    const target = pending.find((row) => row.partnerSlug === PARTNER_SLUG);
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
    expect(payout.invoiceEmailSentTo).toBe(PARTNER_EMAIL);
    expect(payout.createdBy).toBe('admin@datenschutzpartner.ch');
    expect(payout.status).toBe('invoice_requested');
    expect(payout.referralReferences).toHaveLength(payout.referralIds.length);
    expect(await statusOf(post('/affiliate/admin/payouts', request_))).toBe(409);

    const after = await dashboard();
    expect(after.stats.unpaidEarningsChf).toBe(0);
    expect(after.stats.paidEarningsChf).toBeCloseTo(
      before.stats.paidEarningsChf + preview.amountChf
    );
    expect(after.payouts[0]?.id).toBe(payout.id);

    asAdmin();
    const transferred = await post<AffiliateAdminPayout>(
      `/affiliate/admin/payouts/${payout.id}/mark-transferred`
    );
    expect(transferred.status).toBe('transferred');
    expect(transferred.transferredBy).toBe('admin@datenschutzpartner.ch');
    expect(await statusOf(post(`/affiliate/admin/payouts/${payout.id}/mark-transferred`))).toBe(
      409
    );
  });

  it('lets the admin override the rate and deactivate a partner without losing data', async () => {
    const before = await dashboard();
    const partnerId = before.partner.id;
    asAdmin();
    const detail = await request<AffiliateDashboard>(`/affiliate/admin/partners/${partnerId}`);
    expect(detail.referrals).toHaveLength(before.referrals.length);

    const patch = (commissionRate: number) =>
      request<AffiliateAdminPartner>(`/affiliate/admin/partners/${partnerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ commissionRate }),
      });
    expect((await patch(0.15)).commissionRate).toBe(0.15);
    expect(await statusOf(patch(0.9))).toBe(400);

    const inactive = await post<AffiliateAdminPartner>(
      `/affiliate/admin/partners/${partnerId}/deactivate`
    );
    expect(inactive.status).toBe('inactive');
    const click = await post<{ attributed: boolean }>('/affiliate/clicks', {
      slug: PARTNER_SLUG,
      targetPath: '/',
    });
    expect(click.attributed).toBe(false);
    const whileInactive = await dashboard();
    expect(whileInactive.partner.status).toBe('inactive');
    expect(whileInactive.stats.visits).toBe(before.stats.visits);

    asAdmin();
    const active = await post<AffiliateAdminPartner>(
      `/affiliate/admin/partners/${partnerId}/reactivate`
    );
    expect(active).toMatchObject({ status: 'active', deactivatedAt: null });
  });

  it('keeps admin endpoints admin-only', async () => {
    asPartner();
    expect(await statusOf(request('/affiliate/admin/partners'))).toBe(403);
    expect(await statusOf(request('/affiliate/admin/payouts'))).toBe(403);
  });
});
