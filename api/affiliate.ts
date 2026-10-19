import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
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

export const affiliateProgramSettingsSchema = z.object({
  cookieDays: z.number().int().min(1).max(90),
  defaultCommissionRate: z.number().min(0).max(1),
  payoutThresholdChf: z.number().min(0),
});

export const affiliatePartnerSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  email: z.email(),
  slug: z.string(),
  referralUrl: z.string(),
  approvedAt: z.string(),
});

export const affiliateReferralLinkSchema = z.object({
  id: z.string(),
  pathSegment: z.string(),
  referralUrl: z.string(),
  createdAt: z.string(),
  clicks: z.number().int(),
  conversions: z.number().int(),
  balanceChf: z.number(),
});

export const affiliateReferralLinkPathUpdateSchema = z.object({
  pathSegment: z.string().trim().regex(AFFILIATE_SLUG_PATTERN, 'validation.affiliateUsername'),
});

export const affiliateDashboardSchema = z.object({
  partner: affiliatePartnerSchema,
  referralLinks: z.array(affiliateReferralLinkSchema),
  clicks: z.number().int(),
  conversions: z.number().int(),
  commissionBalanceChf: z.number(),
  committedCommissionChf: z.number(),
  payoutThresholdChf: z.number(),
  canRequestPayout: z.boolean(),
  payouts: z.array(
    z.object({
      id: z.string(),
      amountChf: z.number(),
      status: z.enum(['pending', 'paid']),
      createdAt: z.string(),
    })
  ),
  recentConversions: z.array(
    z.object({
      id: z.string(),
      orderNumber: z.string(),
      amountChf: z.number(),
      commissionChf: z.number(),
      createdAt: z.string(),
    })
  ),
});

export const affiliateSlugUpdateSchema = z.object({
  slug: z.string().trim().regex(AFFILIATE_SLUG_PATTERN, 'validation.affiliateUsername'),
});

export const affiliateAdminConversionSchema = z.object({
  id: z.string(),
  partnerEmail: z.string(),
  partnerSlug: z.string(),
  orderNumber: z.string(),
  amountChf: z.number(),
  commissionChf: z.number(),
  createdAt: z.string(),
});

export type AffiliateApplicationForm = z.infer<
  ReturnType<typeof createAffiliateApplicationFormSchema>
>;
export type AffiliateApplicationCreate = z.infer<typeof affiliateApplicationCreateSchema>;
export type AffiliateApplication = z.infer<typeof affiliateApplicationSchema>;
export type AffiliateProgramSettings = z.infer<typeof affiliateProgramSettingsSchema>;
export type AffiliatePartner = z.infer<typeof affiliatePartnerSchema>;
export type AffiliateReferralLink = z.infer<typeof affiliateReferralLinkSchema>;
export type AffiliateDashboard = z.infer<typeof affiliateDashboardSchema>;
export type AffiliateAdminConversion = z.infer<typeof affiliateAdminConversionSchema>;

export const affiliateKeys = {
  all: ['affiliate'] as const,
  settings: () => [...affiliateKeys.all, 'settings'] as const,
  myApplication: () => [...affiliateKeys.all, 'application', 'me'] as const,
  dashboard: () => [...affiliateKeys.all, 'dashboard', 'me'] as const,
  adminApplications: () => [...affiliateKeys.all, 'admin', 'applications'] as const,
  adminConversions: () => [...affiliateKeys.all, 'admin', 'conversions'] as const,
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

export function useAffiliateDashboard() {
  return useQuery({
    queryKey: affiliateKeys.dashboard(),
    queryFn: () => request<AffiliateDashboard | null>('/affiliate/dashboard/me'),
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

export function useCreateAffiliateReferralLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<AffiliateReferralLink>('/affiliate/partner/me/referral-links', {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.dashboard() });
    },
  });
}

export function useUpdateAffiliateReferralLinkPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pathSegment }: { id: string; pathSegment: string }) =>
      request<AffiliateReferralLink>(`/affiliate/partner/me/referral-links/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pathSegment }),
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
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.adminApplications() });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.adminConversions() });
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

export function useAffiliateAdminConversions() {
  return useQuery({
    queryKey: affiliateKeys.adminConversions(),
    queryFn: () => request<AffiliateAdminConversion[]>('/affiliate/admin/conversions'),
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
