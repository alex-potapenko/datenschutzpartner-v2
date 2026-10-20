import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { normalizeAffiliateTargetPath } from '@/lib/affiliate-attribution';
import { AFFILIATE_REFERRAL_STATUSES } from '@/lib/affiliate-ledger';
import { countLetters } from '@/lib/validation/patterns';
import { normalizeAndValidateWebsiteUrl } from '@/lib/validation/url';
import { request } from './client';

/** Handle in referral URLs — letters, digits, dot, dash, underscore. */
export const AFFILIATE_SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]{1,38}[a-z0-9]$/i;

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

export const AFFILIATE_PAYOUT_CADENCES = [1, 3, 6, 12] as const;

export const affiliateProgramSettingsSchema = z.object({
  cookieDays: z.number().int().min(1).max(90),
  defaultCommissionRate: z.number().min(0).max(0.5),
  payoutThresholdChf: z.number().min(0),
  payoutCadenceMonths: z
    .number()
    .int()
    .refine((value) => (AFFILIATE_PAYOUT_CADENCES as readonly number[]).includes(value)),
});

/** Admin form: the rate is entered in percent; new partners get it, existing ones keep theirs. */
export const affiliateProgramSettingsFormSchema = z.object({
  commissionPercent: z
    .number({ error: 'validation.affiliateRate' })
    .min(0, 'validation.affiliateRate')
    .max(50, 'validation.affiliateRate'),
  cookieDays: z
    .number({ error: 'validation.affiliateCookieDays' })
    .int('validation.affiliateCookieDays')
    .min(1, 'validation.affiliateCookieDays')
    .max(90, 'validation.affiliateCookieDays'),
  payoutThresholdChf: z
    .number({ error: 'validation.affiliateThreshold' })
    .min(0, 'validation.affiliateThreshold')
    .max(10_000, 'validation.affiliateThreshold'),
  payoutCadenceMonths: z.number(),
});

export const affiliateReferralStatusSchema = z.enum(AFFILIATE_REFERRAL_STATUSES);

/** `inactive` = deactivated by an admin: links stop attributing, data is kept. */
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
  earningsChf: z.number(),
});

export const AFFILIATE_CAMPAIGN_PATTERN = /^[a-z0-9_-]{1,40}$/i;

export const affiliateReferralLinkCreateSchema = z.object({
  targetPath: z
    .string()
    .trim()
    .refine(
      (value) => normalizeAffiliateTargetPath(value) !== null,
      'validation.affiliateTargetPath'
    ),
  campaign: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || AFFILIATE_CAMPAIGN_PATTERN.test(value),
      'validation.affiliateCampaign'
    ),
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

/** `invoice_requested` on creation; the admin marks `transferred` after the manual bank transfer. */
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
  /** Payable in the next payout run. */
  unpaidEarningsChf: z.number(),
  paidEarningsChf: z.number(),
});

export const affiliateDashboardSchema = z.object({
  partner: affiliatePartnerSchema,
  referralLinks: z.array(affiliateReferralLinkSchema),
  stats: affiliateDashboardStatsSchema,
  payoutThresholdChf: z.number(),
  payouts: z.array(affiliatePayoutSchema),
  referrals: z.array(affiliateReferralSchema),
});

export const affiliateVisitSchema = z.object({
  id: z.string(),
  targetPath: z.string(),
  referrer: z.string().nullable(),
  campaign: z.string().nullable(),
  converted: z.boolean(),
  createdAt: z.string(),
});

export const affiliateCampaignStatsSchema = z.object({
  /** `null` = visits and referrals without a campaign. */
  campaign: z.string().nullable(),
  visits: z.number().int(),
  referrals: z.number().int(),
  conversionRate: z.number(),
  earningsChf: z.number(),
});

export const affiliateSlugUpdateSchema = z.object({
  slug: z.string().trim().regex(AFFILIATE_SLUG_PATTERN, 'validation.affiliateUsername'),
});

export const affiliatePartnerSettingsUpdateSchema = z.object({
  notificationEmail: z.email('validation.email'),
  notifyOnReferral: z.boolean(),
});

export const affiliateAdminPartnerSchema = z.object({
  id: z.string(),
  email: z.string(),
  slug: z.string(),
  approvedAt: z.string(),
  commissionRate: z.number(),
  status: affiliatePartnerStatusSchema,
  deactivatedAt: z.string().nullable(),
  visits: z.number().int(),
  referralCounts: z.record(affiliateReferralStatusSchema, z.number().int()),
  unpaidEarningsChf: z.number(),
  paidEarningsChf: z.number(),
});

/** Admin edits the rate in percent; the API stores a 0–1 fraction. Applies to new referrals only. */
export const AFFILIATE_MAX_COMMISSION_PERCENT = 50;

export const affiliateCommissionRateFormSchema = z.object({
  percent: z
    .number({ error: 'validation.affiliateRate' })
    .min(0, 'validation.affiliateRate')
    .max(AFFILIATE_MAX_COMMISSION_PERCENT, 'validation.affiliateRate'),
});

export const affiliateAdminReferralSchema = z.object({
  id: z.string(),
  partnerId: z.string(),
  partnerEmail: z.string(),
  partnerSlug: z.string(),
  reference: z.string(),
  description: z.string(),
  orderAmountChf: z.number(),
  commissionChf: z.number(),
  status: affiliateReferralStatusSchema,
  createdAt: z.string(),
  payoutId: z.string().nullable(),
});

export const affiliateAdminPayoutSchema = affiliatePayoutSchema.extend({
  partnerId: z.string(),
  partnerEmail: z.string(),
  partnerSlug: z.string(),
  referralIds: z.array(z.string()),
  referralReferences: z.array(z.string()),
  createdBy: z.string(),
  transferredBy: z.string().nullable(),
  method: z.literal('manual'),
  invoiceEmailSentTo: z.string(),
});

export const affiliatePayoutRequestSchema = z.object({
  partnerId: z.string().min(1),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
});

export const affiliatePayoutPreviewSchema = z.object({
  partnerId: z.string(),
  partnerEmail: z.string(),
  notificationEmail: z.string(),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  referrals: z.array(affiliateAdminReferralSchema),
  amountChf: z.number(),
  payoutThresholdChf: z.number(),
  belowThreshold: z.boolean(),
});

export type AffiliateApplicationForm = z.infer<
  ReturnType<typeof createAffiliateApplicationFormSchema>
>;
export type AffiliateApplicationCreate = z.infer<typeof affiliateApplicationCreateSchema>;
export type AffiliateApplication = z.infer<typeof affiliateApplicationSchema>;
export type AffiliateProgramSettings = z.infer<typeof affiliateProgramSettingsSchema>;
export type AffiliateProgramSettingsForm = z.infer<typeof affiliateProgramSettingsFormSchema>;
export type AffiliateReferralStatus = z.infer<typeof affiliateReferralStatusSchema>;
export type AffiliatePartner = z.infer<typeof affiliatePartnerSchema>;
export type AffiliateReferralLink = z.infer<typeof affiliateReferralLinkSchema>;
export type AffiliateReferralLinkCreate = z.infer<typeof affiliateReferralLinkCreateSchema>;
export type AffiliateReferral = z.infer<typeof affiliateReferralSchema>;
export type AffiliatePayout = z.infer<typeof affiliatePayoutSchema>;
export type AffiliatePayoutStatus = z.infer<typeof affiliatePayoutStatusSchema>;
export type AffiliateDashboard = z.infer<typeof affiliateDashboardSchema>;
export type AffiliateVisit = z.infer<typeof affiliateVisitSchema>;
export type AffiliateCampaignStats = z.infer<typeof affiliateCampaignStatsSchema>;
export type AffiliatePartnerSettingsUpdate = z.infer<typeof affiliatePartnerSettingsUpdateSchema>;
export type AffiliateAdminPartner = z.infer<typeof affiliateAdminPartnerSchema>;
export type AffiliatePartnerStatus = z.infer<typeof affiliatePartnerStatusSchema>;
export type AffiliateCommissionRateForm = z.infer<typeof affiliateCommissionRateFormSchema>;
export type AffiliateAdminReferral = z.infer<typeof affiliateAdminReferralSchema>;
export type AffiliateAdminPayout = z.infer<typeof affiliateAdminPayoutSchema>;
export type AffiliatePayoutRequest = z.infer<typeof affiliatePayoutRequestSchema>;
export type AffiliatePayoutPreview = z.infer<typeof affiliatePayoutPreviewSchema>;

export const affiliateKeys = {
  all: ['affiliate'] as const,
  settings: () => [...affiliateKeys.all, 'settings'] as const,
  myApplication: () => [...affiliateKeys.all, 'application', 'me'] as const,
  dashboard: () => [...affiliateKeys.all, 'dashboard', 'me'] as const,
  visits: () => [...affiliateKeys.all, 'visits', 'me'] as const,
  campaigns: () => [...affiliateKeys.all, 'campaigns', 'me'] as const,
  admin: () => [...affiliateKeys.all, 'admin'] as const,
  adminApplications: () => [...affiliateKeys.admin(), 'applications'] as const,
  adminPartners: () => [...affiliateKeys.admin(), 'partners'] as const,
  adminPartner: (id: string) => [...affiliateKeys.admin(), 'partners', id] as const,
  adminReferrals: (status?: AffiliateReferralStatus) =>
    [...affiliateKeys.admin(), 'referrals', status ?? 'all'] as const,
  adminPayouts: () => [...affiliateKeys.admin(), 'payouts'] as const,
};

export function useAffiliateProgramSettings() {
  return useQuery({
    queryKey: affiliateKeys.settings(),
    queryFn: () => request<AffiliateProgramSettings>('/affiliate/settings'),
  });
}

export function useUpdateAffiliateProgramSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: AffiliateProgramSettings) =>
      request<AffiliateProgramSettings>('/affiliate/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
    },
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

export function useAffiliateDashboard() {
  return useQuery({
    queryKey: affiliateKeys.dashboard(),
    queryFn: () => request<AffiliateDashboard | null>('/affiliate/dashboard/me'),
  });
}

export function useAffiliateVisits() {
  return useQuery({
    queryKey: affiliateKeys.visits(),
    queryFn: () => request<AffiliateVisit[]>('/affiliate/partner/me/visits'),
  });
}

export function useAffiliateCampaignStats() {
  return useQuery({
    queryKey: affiliateKeys.campaigns(),
    queryFn: () => request<AffiliateCampaignStats[]>('/affiliate/partner/me/campaigns'),
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

export function useAffiliateAdminApplications() {
  return useQuery({
    queryKey: affiliateKeys.adminApplications(),
    queryFn: () => request<AffiliateApplication[]>('/affiliate/admin/applications'),
  });
}

export function useApproveAffiliateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<AffiliatePartner>(`/affiliate/admin/applications/${id}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.admin() });
    },
  });
}

export function useRejectAffiliateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<AffiliateApplication>(`/affiliate/admin/applications/${id}/reject`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.adminApplications() });
    },
  });
}

export function useAffiliateAdminPartners() {
  return useQuery({
    queryKey: affiliateKeys.adminPartners(),
    queryFn: () => request<AffiliateAdminPartner[]>('/affiliate/admin/partners'),
  });
}

/** Partner detail for the admin — same shape as the partner's own dashboard. */
export function useAffiliateAdminPartner(id: string | null) {
  return useQuery({
    queryKey: affiliateKeys.adminPartner(id ?? ''),
    queryFn: () => request<AffiliateDashboard>(`/affiliate/admin/partners/${id ?? ''}`),
    enabled: Boolean(id),
  });
}

export function useUpdateAffiliatePartnerRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commissionRate }: { id: string; commissionRate: number }) =>
      request<AffiliateAdminPartner>(`/affiliate/admin/partners/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ commissionRate }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
    },
  });
}

export function useSetAffiliatePartnerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      request<AffiliateAdminPartner>(
        `/affiliate/admin/partners/${id}/${active ? 'reactivate' : 'deactivate'}`,
        { method: 'POST' }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
    },
  });
}

export function useAffiliateAdminReferrals(status?: AffiliateReferralStatus) {
  return useQuery({
    queryKey: affiliateKeys.adminReferrals(status),
    queryFn: () =>
      request<AffiliateAdminReferral[]>(
        status ? `/affiliate/admin/referrals?status=${status}` : '/affiliate/admin/referrals'
      ),
  });
}

/**
 * Prototype (MSW): stands in for the order-paid webhook — moves a pending referral to unpaid
 * and sends the partner's commission email when enabled.
 */
export function useMarkAffiliateOrderPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<AffiliateAdminReferral & { commissionEmailSentTo: string | null }>(
        `/affiliate/admin/referrals/${id}/mark-order-paid`,
        { method: 'POST' }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
    },
  });
}

export function useRejectAffiliateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<AffiliateAdminReferral>(`/affiliate/admin/referrals/${id}/reject`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
    },
  });
}

export function useAffiliateAdminPayouts() {
  return useQuery({
    queryKey: affiliateKeys.adminPayouts(),
    queryFn: () => request<AffiliateAdminPayout[]>('/affiliate/admin/payouts'),
  });
}

export function usePreviewAffiliatePayout() {
  return useMutation({
    mutationFn: (input: AffiliatePayoutRequest) =>
      request<AffiliatePayoutPreview>('/affiliate/admin/payouts/preview', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

/** Settles the selected unpaid referrals and emails the partner an invoice request. */
export function useCreateAffiliatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AffiliatePayoutRequest) =>
      request<AffiliateAdminPayout>('/affiliate/admin/payouts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
    },
  });
}

/** Records that the invoice was received and the money transferred outside the product. */
export function useMarkAffiliatePayoutTransferred() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<AffiliateAdminPayout>(`/affiliate/admin/payouts/${id}/mark-transferred`, {
        method: 'POST',
      }),
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

/** Prototype (MSW): leave the affiliate program and reset partner data. */
export function useQuitAffiliateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<{ ok: true }>('/affiliate/prototype/quit', {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.myApplication() });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}
