import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { normalizeAffiliateTargetPath } from '@/lib/affiliate-attribution';
import { AFFILIATE_REFERRAL_STATUSES } from '@/lib/affiliate-ledger';
import { countLetters } from '@/lib/validation/patterns';
import { normalizeAndValidateWebsiteUrl } from '@/lib/validation/url';
import { request } from './client';

/** Public partner number in `/ref/{id}` — exactly three digits (stored in `slug`). */
export const AFFILIATE_PARTNER_ID_PATTERN = /^\d{3}$/;

/** @deprecated Use {@link AFFILIATE_PARTNER_ID_PATTERN}. */
export const AFFILIATE_SLUG_PATTERN = AFFILIATE_PARTNER_ID_PATTERN;

export function createAffiliateApplicationFormSchema(tv: (key: string) => string) {
  return z.object({
    email: z.email(tv('email')),
    websiteUrl: z
      .string()
      .trim()
      .min(1, tv('required'))
      .refine((value) => normalizeAndValidateWebsiteUrl(value) !== null, tv('website')),
    description: z
      .string()
      .trim()
      .max(5000, tv('messageMax'))
      .superRefine((value, ctx) => {
        if (!value) return;
        if (value.length < 10) {
          ctx.addIssue({ code: 'custom', message: tv('messageMin') });
          return;
        }
        if (countLetters(value) < 2) {
          ctx.addIssue({ code: 'custom', message: tv('message') });
        }
      }),
    acceptTerms: z.boolean().refine((value) => value, { message: tv('terms') }),
  });
}

export const affiliateApplicationCreateSchema = createAffiliateApplicationFormSchema(
  (key) => `validation.${key}`
).omit({ acceptTerms: true });

export const affiliateApplicationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const affiliateApplicationSchema = affiliateApplicationCreateSchema.extend({
  id: z.string(),
  status: affiliateApplicationStatusSchema,
  createdAt: z.string(),
  reviewedAt: z.string().nullable(),
});

export const affiliateProgramSettingsSchema = z.object({
  cookieDays: z.number().int().min(1).max(90),
  defaultCommissionRate: z.number().min(0).max(1),
  payoutThresholdChf: z.number().min(0),
  payoutCadenceMonths: z.number().int().min(1),
  /** Admin cap for partner-created voucher discount (A-62). */
  maxVoucherDiscountPercent: z.number().min(1).max(100),
});

export const AFFILIATE_CAMPAIGN_PATTERN = /^[a-z0-9][a-z0-9-_]{0,38}[a-z0-9]$/i;

export const affiliateVoucherSchema = z.object({
  id: z.string(),
  code: z.string(),
  discountPercent: z.number(),
  createdAt: z.string(),
});

export const affiliateVoucherCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'validation.required')
    .max(20, 'validation.required')
    .regex(/^[a-z0-9-_]+$/i, 'validation.affiliateVoucherCode'),
  discountPercent: z.number().min(1).max(100),
});

export const affiliateReferralStatusSchema = z.enum(AFFILIATE_REFERRAL_STATUSES);

/** `inactive` = deactivated in the admin tool: links stop attributing, data is kept. */
export const affiliatePartnerStatusSchema = z.enum(['active', 'inactive']);

export const affiliatePartnerSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  email: z.email(),
  slug: z.string(),
  referralUrl: z.string(),
  approvedAt: z.string(),
  commissionRate: z.number(),
  notificationEmail: z.email(),
  notifyOnReferral: z.boolean(),
  status: affiliatePartnerStatusSchema,
  deactivatedAt: z.string().nullable(),
});

export const affiliateReferralLinkSchema = z.object({
  id: z.string(),
  /** Same-site landing path after attribution; `/` is the home page. */
  targetPath: z.string(),
  campaign: z.string().nullable(),
  referralUrl: z.string(),
  createdAt: z.string(),
  clicks: z.number().int(),
  conversions: z.number().int(),
  /** Sum of Unpaid referral commissions on this link (A-33 balance). */
  balanceChf: z.number(),
});

export const affiliateReferralLinkCreateSchema = z.object({
  targetPath: z
    .string()
    .trim()
    .refine(
      (value) => normalizeAffiliateTargetPath(value) !== null,
      'validation.affiliateTargetPath'
    ),
  /** Optional campaign tag (A-21); appended as `?campaign=` on the referral URL. */
  campaign: z
    .string()
    .trim()
    .max(40)
    .regex(AFFILIATE_CAMPAIGN_PATTERN, 'validation.affiliateCampaign')
    .optional()
    .or(z.literal('')),
});

/** Partner-facing commission row — never carries customer identity. */
export const affiliateReferralSchema = z.object({
  id: z.string(),
  reference: z.string(),
  description: z.string(),
  commissionChf: z.number(),
  status: affiliateReferralStatusSchema,
  createdAt: z.string(),
});

/** `invoice_requested` on creation; the admin tool marks `transferred` after the manual bank transfer. */
export const AFFILIATE_PAYOUT_STATUSES = ['invoice_requested', 'transferred'] as const;
export const affiliatePayoutStatusSchema = z.enum(AFFILIATE_PAYOUT_STATUSES);

export const affiliatePayoutSchema = z.object({
  id: z.string(),
  amountChf: z.number(),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  referralCount: z.number().int(),
  status: affiliatePayoutStatusSchema,
  createdAt: z.string(),
  transferredAt: z.string().nullable(),
});

export const affiliateDashboardStatsSchema = z.object({
  visits: z.number().int(),
  conversionRate: z.number(),
  referralCounts: z.record(affiliateReferralStatusSchema, z.number().int()),
  /** Waiting for the customer order to be paid. */
  pendingEarningsChf: z.number(),
  /** Payable in the next payout run (PRD A-30: Unpaid referrals not yet in a payout). */
  unpaidEarningsChf: z.number(),
  /** PRD A-31: sum of completed (`transferred`) payouts. */
  paidOutToDateChf: z.number(),
});

export const affiliateDashboardSchema = z.object({
  partner: affiliatePartnerSchema,
  referralLinks: z.array(affiliateReferralLinkSchema),
  stats: affiliateDashboardStatsSchema,
  payoutThresholdChf: z.number(),
  /** Next scheduled payout run (YYYY-MM-DD), from program cadence. */
  nextPayoutDate: z.string(),
  payouts: z.array(affiliatePayoutSchema),
  referrals: z.array(affiliateReferralSchema),
  vouchers: z.array(affiliateVoucherSchema),
});

export const affiliateVisitSchema = z.object({
  id: z.string(),
  targetPath: z.string(),
  referrer: z.string().nullable(),
  campaign: z.string().nullable(),
  converted: z.boolean(),
  createdAt: z.string(),
});

export const affiliateSlugUpdateSchema = z.object({
  slug: z.string().trim().regex(AFFILIATE_PARTNER_ID_PATTERN, 'validation.affiliatePartnerId'),
});

export const affiliatePartnerSettingsUpdateSchema = z.object({
  notificationEmail: z.email('validation.email'),
  notifyOnReferral: z.boolean(),
});

export type AffiliateApplicationForm = z.infer<
  ReturnType<typeof createAffiliateApplicationFormSchema>
>;
export type AffiliateApplicationCreate = z.infer<typeof affiliateApplicationCreateSchema>;
export type AffiliateApplication = z.infer<typeof affiliateApplicationSchema>;
export type AffiliateProgramSettings = z.infer<typeof affiliateProgramSettingsSchema>;
export type AffiliateReferralStatus = z.infer<typeof affiliateReferralStatusSchema>;
export type AffiliatePartner = z.infer<typeof affiliatePartnerSchema>;

/** Active partners may create, edit, or delete links, vouchers, slug, and settings. */
export function isAffiliatePartnerEditable(partner: Pick<AffiliatePartner, 'status'>): boolean {
  return partner.status === 'active';
}
export type AffiliateReferralLink = z.infer<typeof affiliateReferralLinkSchema>;
export type AffiliateReferralLinkCreate = z.infer<typeof affiliateReferralLinkCreateSchema>;
export type AffiliateReferral = z.infer<typeof affiliateReferralSchema>;
export type AffiliatePayout = z.infer<typeof affiliatePayoutSchema>;
export type AffiliatePayoutStatus = z.infer<typeof affiliatePayoutStatusSchema>;
export type AffiliateDashboard = z.infer<typeof affiliateDashboardSchema>;
export type AffiliateVisit = z.infer<typeof affiliateVisitSchema>;
export type AffiliatePartnerSettingsUpdate = z.infer<typeof affiliatePartnerSettingsUpdateSchema>;
export type AffiliatePartnerStatus = z.infer<typeof affiliatePartnerStatusSchema>;
export type AffiliateVoucher = z.infer<typeof affiliateVoucherSchema>;
export type AffiliateVoucherCreate = z.infer<typeof affiliateVoucherCreateSchema>;

export const affiliateKeys = {
  all: ['affiliate'] as const,
  settings: () => [...affiliateKeys.all, 'settings'] as const,
  myApplication: () => [...affiliateKeys.all, 'application', 'me'] as const,
  dashboard: () => [...affiliateKeys.all, 'dashboard', 'me'] as const,
  visits: () => [...affiliateKeys.all, 'visits', 'me'] as const,
};

export function useAffiliateProgramSettings() {
  return useQuery({
    queryKey: affiliateKeys.settings(),
    queryFn: () => request<AffiliateProgramSettings>('/affiliate/settings'),
  });
}

export function useMyAffiliateApplication() {
  return useQuery({
    queryKey: affiliateKeys.myApplication(),
    queryFn: () => request<AffiliateApplication | null>('/affiliate/applications/me'),
  });
}

export function useCreateAffiliateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AffiliateApplicationCreate) =>
      request<AffiliateApplication>('/affiliate/applications', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.myApplication() });
    },
  });
}

export function useAffiliateDashboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: affiliateKeys.dashboard(),
    queryFn: () => request<AffiliateDashboard | null>('/affiliate/dashboard/me'),
    enabled: options?.enabled ?? true,
  });
}

export function useAffiliateVisits() {
  return useQuery({
    queryKey: affiliateKeys.visits(),
    queryFn: () => request<AffiliateVisit[]>('/affiliate/partner/me/visits'),
  });
}

export type AffiliateVisitInput = {
  slug: string;
  targetPath: string | null;
  campaign: string | null;
  referrer: string | null;
};

export type AffiliateVisitResult = {
  ok: true;
  /** Same-site landing path, already sanitized by the server. */
  targetPath: string;
  /** `false` when the slug belongs to no partner — do not set the attribution cookie. */
  attributed: boolean;
};

export function useRecordAffiliateVisit() {
  return useMutation({
    mutationFn: (input: AffiliateVisitInput) =>
      request<AffiliateVisitResult>('/affiliate/clicks', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useUpdateAffiliateSlug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof affiliateSlugUpdateSchema>) =>
      request<AffiliatePartner>('/affiliate/partner/me/slug', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}

export function useUpdateAffiliatePartnerSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AffiliatePartnerSettingsUpdate) =>
      request<AffiliatePartner>('/affiliate/partner/me/settings', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}

export function useCreateAffiliateReferralLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AffiliateReferralLinkCreate) =>
      request<AffiliateReferralLink>('/affiliate/partner/me/referral-links', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}

export function useDeleteAffiliateReferralLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ ok: true }>(`/affiliate/partner/me/referral-links/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}

type AffiliatePrototypeAction =
  | 'mark-order-paid'
  | 'create-payout'
  | 'mark-transferred'
  | 'toggle-active';

/**
 * Prototype (MSW): stands in for the external admin tool and the order-paid webhook, scoped to
 * the signed-in partner. Not part of the backend contract.
 */
export function useAffiliatePrototypeAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: AffiliatePrototypeAction) =>
      request<{
        reference?: string;
        commissionChf?: number;
        commissionEmailSentTo?: string | null;
        amountChf?: number;
        invoiceEmailSentTo?: string;
        status?: AffiliatePartnerStatus;
      }>(`/affiliate/prototype/${action}`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
    },
  });
}

/** Prototype (MSW): simulate the approval email and return the referral link. */
export function useSimulateAffiliateApprovalEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<{ referralUrl: string }>('/affiliate/prototype/simulate-approval-email', {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.myApplication() });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}

/** A-04: deactivate the partner account; links stop attributing, data is retained. */
export function useLeaveAffiliateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<{ ok: true }>('/affiliate/partner/me/leave', {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
    },
  });
}

/** @deprecated Use {@link useLeaveAffiliateProgram}. */
export const useQuitAffiliateProgram = useLeaveAffiliateProgram;

export function useCreateAffiliateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AffiliateVoucherCreate) =>
      request<AffiliateVoucher>('/affiliate/partner/me/vouchers', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}

export function useDeleteAffiliateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ ok: true }>(`/affiliate/partner/me/vouchers/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}
