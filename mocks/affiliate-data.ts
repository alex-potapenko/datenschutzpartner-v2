import { affiliateReferralUrl } from '@/lib/affiliate-attribution';
import type {
  AffiliateAdminConversion,
  AffiliateApplication,
  AffiliateProgramSettings,
} from '@/api/affiliate';

export const AFFILIATE_PROGRAM_SETTINGS: AffiliateProgramSettings = {
  cookieDays: 30,
  defaultCommissionRate: 0.1,
  payoutThresholdChf: 50,
};

export type AffiliatePartnerRecord = {
  id: string;
  applicationId: string;
  email: string;
  slug: string;
  approvedAt: string;
  clickCount: number;
};

export type AffiliateReferralLinkRecord = {
  id: string;
  partnerId: string;
  pathSegment: string;
  createdAt: string;
  clickCount: number;
};

export type AffiliateConversionRecord = {
  id: string;
  partnerId: string;
  referralLinkId: string | null;
  orderNumber: string;
  amountChf: number;
  commissionChf: number;
  createdAt: string;
};

export type AffiliatePayoutRecord = {
  id: string;
  partnerId: string;
  amountChf: number;
  status: 'pending' | 'paid';
  createdAt: string;
};

export function referralUrl(_origin: string, pathSegment: string) {
  return affiliateReferralUrl(pathSegment);
}

export function slugFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'partner';
  const normalized = local
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return normalized.length >= 3 ? normalized : `partner-${normalized || '1'}`;
}

export function createAffiliateSeedApplications(): AffiliateApplication[] {
  return [];
}

export function createAffiliateSeedPartners(): AffiliatePartnerRecord[] {
  return [];
}

export function createAffiliateSeedConversions(): AffiliateConversionRecord[] {
  return [];
}

export function createAffiliateSeedPayouts(): AffiliatePayoutRecord[] {
  return [];
}

export function createAffiliateSeedReferralLinks(): AffiliateReferralLinkRecord[] {
  return [];
}

export function toAdminConversion(
  row: AffiliateConversionRecord,
  partner: AffiliatePartnerRecord,
  pathSegment: string
): AffiliateAdminConversion {
  return {
    id: row.id,
    partnerEmail: partner.email,
    partnerSlug: pathSegment,
    orderNumber: row.orderNumber,
    amountChf: row.amountChf,
    commissionChf: row.commissionChf,
    createdAt: row.createdAt,
  };
}
