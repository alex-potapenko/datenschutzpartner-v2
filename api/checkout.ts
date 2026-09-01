import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { accountKeys } from './account';
import { billingKeys } from './billing';
import { documentKeys, documentSchema } from './documents';
import { euRepKeys } from './eu-rep';
import { env } from '@/env';
import { getAuthToken } from '@/lib/auth-session';
import { request } from './client';

/**
 * Checkout domain — Payrexx-hosted payment sessions for the Privacy Policy
 * Generator (one policy subscription at a time, or a renewal) and related
 * side effects (orders, hosted document creation). Components never talk
 * to Payrexx directly; they create a session, redirect to `redirectUrl`, then
 * confirm completion via `useCompleteCheckoutSession`.
 */

/** Yearly list price per website on a policy subscription (CHF, excl. VAT). */
export const GENERATOR_POLICY_UNIT_PRICE = 89;

/** Swiss statutory VAT rate applied to checkout totals. */
export const SWISS_VAT_RATE = 0.081;

/** Free trial length for wizard purchases (policy + bundled EU Basis). */
export const POLICY_TRIAL_DAYS = 14;

export function calculateVatAmount(amountExclVat: number): number {
  return roundMoney(amountExclVat * SWISS_VAT_RATE);
}

export function calculateAmountInclVat(amountExclVat: number): number {
  return roundMoney(amountExclVat * (1 + SWISS_VAT_RATE));
}

export function formatSwissVatPercent(): string {
  return (SWISS_VAT_RATE * 100).toFixed(1);
}

export const GENERATOR_SITE_QUANTITY_MIN = 1;
export const GENERATOR_SITE_QUANTITY_MAX = 99;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Volume discount is based on **paid site capacity** on active policy
 * subscriptions (`siteCount` sum). A **new purchase** is priced on
 * `active sites + sites in this order` — crossing a higher tier in the
 * current cart unlocks that rate for the whole order. **Renewal** uses the
 * live active site count only (including the subscription being renewed).
 */
export type GeneratorVolumeDiscountTier = {
  /** Inclusive lower bound of active sites that unlock this rate. */
  minSites: number;
  /** Inclusive upper bound; `null` means no upper bound. */
  maxSites: number | null;
  rate: number;
};

export const GENERATOR_VOLUME_DISCOUNT_TIERS: readonly GeneratorVolumeDiscountTier[] = [
  { minSites: 0, maxSites: 3, rate: 0 },
  { minSites: 4, maxSites: 5, rate: 0.05 },
  { minSites: 6, maxSites: 10, rate: 0.075 },
  { minSites: 11, maxSites: null, rate: 0.1 },
];

export function generatorVolumeDiscountTier(activeSiteCount: number): GeneratorVolumeDiscountTier {
  const count = Math.max(0, Math.floor(activeSiteCount));
  const match = GENERATOR_VOLUME_DISCOUNT_TIERS.find((tier) => {
    if (count < tier.minSites) return false;
    if (tier.maxSites == null) return true;
    return count <= tier.maxSites;
  });
  const fallback = GENERATOR_VOLUME_DISCOUNT_TIERS[0];
  if (!fallback) {
    return { minSites: 0, maxSites: 3, rate: 0 };
  }
  return match ?? fallback;
}

export function generatorVolumeDiscountRate(activeSiteCount: number): number {
  return generatorVolumeDiscountTier(activeSiteCount).rate;
}

/**
 * Site capacity that determines the volume rate.
 * New generator orders include the sites being bought now; renewal does not.
 */
export function qualifyingSiteCountForCheckout(
  activeSiteCount: number,
  kind: CheckoutKind,
  siteCount = 1
): number {
  const active = Math.max(0, Math.floor(activeSiteCount));
  const sites = Math.max(1, Math.floor(siteCount));
  if (kind === 'generatorRenewal') {
    return active;
  }
  return active + sites;
}

/** Display helper — `0.075` → `"7.5"`. */
export function formatDiscountPercent(rate: number): string {
  return String(roundMoney(rate * 100));
}

/**
 * Copy params for the renewal tooltip. `null` when no volume discount applies.
 * `minSites` is the threshold of the matched tier, not the member's current count.
 */
export function generatorVolumeDiscountExplanation(
  activeSiteCount: number
): { minSites: number; percent: string } | null {
  const tier = generatorVolumeDiscountTier(activeSiteCount);
  if (tier.rate <= 0) return null;
  return { minSites: tier.minSites, percent: formatDiscountPercent(tier.rate) };
}

export type GeneratorPolicyQuote = {
  siteCount: number;
  qualifyingSiteCount: number;
  unitPrice: number;
  discountRate: number;
  listPrice: number;
  discountAmount: number;
  amountDue: number;
};

/**
 * Price one policy subscription covering `siteCount` websites. The volume
 * rate comes from `qualifyingSiteCount` — every site on this order gets
 * that same rate (never split inside the subscription).
 */
export function calculateGeneratorPolicyQuote(
  qualifyingSiteCount: number,
  siteCount = 1
): GeneratorPolicyQuote {
  const sites = Math.max(1, Math.floor(siteCount));
  const qualifying = Math.max(0, Math.floor(qualifyingSiteCount));
  const discountRate = generatorVolumeDiscountRate(qualifying);
  const listPrice = roundMoney(sites * GENERATOR_POLICY_UNIT_PRICE);
  const discountAmount = roundMoney(listPrice * discountRate);
  const amountDue = roundMoney(listPrice - discountAmount);

  return {
    siteCount: sites,
    qualifyingSiteCount: qualifying,
    unitPrice: GENERATOR_POLICY_UNIT_PRICE,
    discountRate,
    listPrice,
    discountAmount,
    amountDue,
  };
}

export const checkoutKindEnum = z.enum([
  'generator',
  'generatorTopUp',
  'generatorRenewal',
  'euRep',
]);
export type CheckoutKind = z.infer<typeof checkoutKindEnum>;

/** Extra supervisory / data-subject inquiry beyond the plan allowance (CHF, excl. VAT). */
export const EU_REP_EXTRA_REQUEST_PRICE = 99;

export const euRepPlanIdSchema = z.enum(['basis', 'plus', 'plus5']);
export type EuRepPlanId = z.infer<typeof euRepPlanIdSchema>;

export type EuRepPlanDefinition = {
  id: EuRepPlanId;
  /** Yearly subscription price (CHF, excl. VAT). */
  yearlyPrice: number;
  /** Included payable inquiries per year. */
  includedRequests: number;
};

/** Entry plan — the wizard always sells this one, and it backs every fallback. */
export const EU_REP_BASIS_PLAN: EuRepPlanDefinition = {
  id: 'basis',
  yearlyPrice: 149,
  includedRequests: 0,
};

export const EU_REP_PLANS: readonly EuRepPlanDefinition[] = [
  EU_REP_BASIS_PLAN,
  { id: 'plus', yearlyPrice: 229, includedRequests: 1 },
  { id: 'plus5', yearlyPrice: 499, includedRequests: 5 },
] as const;

/** Plan ids arrive as plain strings from the API — unknown ids fall back to Basis. */
export function resolveEuRepPlan(planId: string | undefined): EuRepPlanDefinition {
  return EU_REP_PLANS.find((plan) => plan.id === planId) ?? EU_REP_BASIS_PLAN;
}

export const EU_REP_ENTITY_QUANTITY_MIN = 1;
export const EU_REP_ENTITY_QUANTITY_MAX = 99;

export type EuRepQuote = {
  planId: EuRepPlanId;
  includedRequests: number;
  unitPrice: number;
  entityCount: number;
  amountDue: number;
};

/**
 * Price an EU Representation plan subscription. Standalone checkout picks any
 * plan; the generator wizard always uses Basis. `entityCount` is informational
 * for first-entity setup — the yearly fee is per plan, not per entity.
 */
export function calculateEuRepQuote(planId: string = 'basis', entityCount = 1): EuRepQuote {
  const plan = resolveEuRepPlan(planId);
  const count = Math.min(
    EU_REP_ENTITY_QUANTITY_MAX,
    Math.max(EU_REP_ENTITY_QUANTITY_MIN, Math.floor(entityCount))
  );
  return {
    planId: plan.id,
    includedRequests: plan.includedRequests,
    unitPrice: plan.yearlyPrice,
    entityCount: count,
    amountDue: plan.yearlyPrice,
  };
}

export const euRepCheckoutEntitySchema = z.object({
  legalEntity: z.string().min(1),
  forwardingEmail: z.email(),
  postalLine1: z.string().min(1).optional(),
  postalLine2: z.string().optional(),
  postalCode: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
});
export type EuRepCheckoutEntity = z.infer<typeof euRepCheckoutEntitySchema>;

export const checkoutSessionCreateSchema = z.object({
  kind: checkoutKindEnum,
  /** Websites covered by this new (or renewing) subscription. */
  siteCount: z.number().int().positive().optional(),
  /** Covered website when purchasing through the generator wizard. */
  domain: z.string().min(1).optional(),
  policyName: z.string().min(1).optional(),
  /** Swiss controller of the generated policy (from the questionnaire). */
  legalEntity: z.string().min(1).optional(),
  /** EU Rep plan — standalone only; wizard always bills Basis. */
  euRepPlanId: euRepPlanIdSchema.optional(),
  /** How many Swiss legal-entity slots to buy (`euRep`, or bundled on a generator checkout). */
  euRepEntityCount: z.number().int().positive().optional(),
  /** Details for each new EU Rep contract created by this checkout. */
  euRepEntities: z.array(euRepCheckoutEntitySchema).optional(),
  /** Link the new hosted policy to this existing contract (no extra EU Rep charge). */
  euRepLinkContractId: z.string().min(1).optional(),
  /** Which policy subscription to renew (`generatorRenewal` only). */
  subscriptionId: z.string().min(1).optional(),
  /** Fill a prepaid slot on this policy subscription (wizard fill-slot mode). */
  fillSubscriptionId: z.string().min(1).optional(),
});
export type CheckoutSessionCreate = z.infer<typeof checkoutSessionCreateSchema>;

export const checkoutSessionSchema = z.object({
  id: z.string(),
  /** Payrexx hosted checkout URL — open in the same tab in production. */
  redirectUrl: z.string(),
  amount: z.number(),
  currency: z.string(),
  siteCount: z.number().int().positive(),
  listPrice: z.number().optional(),
  discountRate: z.number().optional(),
  discountAmount: z.number().optional(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const checkoutCompleteResultSchema = z.object({
  sessionId: z.string(),
  orderId: z.string(),
  document: documentSchema.optional(),
  activeSubscriptionCount: z.number().int().nonnegative(),
  nextPaymentDate: z.string().nullable(),
  discountRate: z.number().optional(),
  discountAmount: z.number().optional(),
  /** Standalone EU Rep purchase with hosted policies not yet linked. */
  needsPolicyLinking: z.boolean().optional(),
  /** First new contract — kept for older clients. */
  euRepContractId: z.string().optional(),
  /** New contracts created by this checkout, in purchase order. */
  euRepContractIds: z.array(z.string()).optional(),
});
export type CheckoutCompleteResult = z.infer<typeof checkoutCompleteResultSchema>;

export const payrexxPortalSchema = z.object({
  url: z.string(),
});
export type PayrexxPortal = z.infer<typeof payrexxPortalSchema>;

export const invoiceDownloadSchema = z.object({
  url: z.string(),
  filename: z.string(),
});
export type InvoiceDownload = z.infer<typeof invoiceDownloadSchema>;

export const pendingCheckoutSchema = z.object({
  needed: z.boolean(),
  trialEndsAt: z.string().optional(),
  domain: z.string().optional(),
  legalEntity: z.string().optional(),
  fillSubscriptionId: z.string().optional(),
  documentId: z.string().optional(),
  subscriptionId: z.string().optional(),
  euRepEntityCount: z.number().int().positive().optional(),
  euRepEntities: z.array(euRepCheckoutEntitySchema).optional(),
  euRepLinkContractId: z.string().optional(),
});
export type PendingCheckout = z.infer<typeof pendingCheckoutSchema>;

export const startPolicyTrialResultSchema = z.object({
  document: documentSchema.optional(),
  subscriptionId: z.string().optional(),
  trialEndsAt: z.string().optional(),
  documentId: z.string().optional(),
});
export type StartPolicyTrialResult = z.infer<typeof startPolicyTrialResultSchema>;

export const checkoutKeys = {
  payrexxPortal: ['checkout', 'payrexx-portal'] as const,
  pending: ['checkout', 'pending'] as const,
};

export function usePendingCheckout(site?: string | null) {
  const normalizedSite =
    site
      ?.replace(/^www\./, '')
      .trim()
      .toLowerCase() ?? '';

  return useQuery({
    queryKey: [...checkoutKeys.pending, normalizedSite],
    queryFn: () =>
      request<PendingCheckout>(
        normalizedSite
          ? `/checkout/pending?site=${encodeURIComponent(normalizedSite)}`
          : '/checkout/pending'
      ),
    enabled: Boolean(normalizedSite),
  });
}

export function useStartPolicyTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutSessionCreate) =>
      request<StartPolicyTrialResult>('/checkout/trial', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: checkoutKeys.pending }),
        queryClient.invalidateQueries({ queryKey: accountKeys.snapshot }),
      ]);
    },
  });
}

export function useCompletePendingCheckout(site?: string | null) {
  const normalizedSite =
    site
      ?.replace(/^www\./, '')
      .trim()
      .toLowerCase() ?? '';
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<CheckoutCompleteResult>(
        normalizedSite
          ? `/checkout/pending/complete?site=${encodeURIComponent(normalizedSite)}`
          : '/checkout/pending/complete',
        { method: 'POST' }
      ),
    onSuccess: async (result) => {
      queryClient.setQueryData(documentKeys.plan, {
        activeSubscriptionCount: result.activeSubscriptionCount,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: documentKeys.plan }),
        queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: billingKeys.orders }),
        queryClient.invalidateQueries({ queryKey: accountKeys.snapshot }),
        queryClient.invalidateQueries({ queryKey: euRepKeys.contracts }),
        queryClient.invalidateQueries({ queryKey: checkoutKeys.pending }),
      ]);
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (input: CheckoutSessionCreate) =>
      request<CheckoutSession>('/checkout/sessions', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useCompleteCheckoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      request<CheckoutCompleteResult>(`/checkout/sessions/${sessionId}/complete`, {
        method: 'POST',
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData(documentKeys.plan, {
        activeSubscriptionCount: result.activeSubscriptionCount,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: documentKeys.plan }),
        queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: billingKeys.orders }),
        queryClient.invalidateQueries({ queryKey: accountKeys.snapshot }),
        queryClient.invalidateQueries({ queryKey: euRepKeys.contracts }),
      ]);
    },
  });
}

export function usePayrexxPortalUrl() {
  return useQuery({
    queryKey: checkoutKeys.payrexxPortal,
    queryFn: () => request<PayrexxPortal>('/checkout/payrexx-portal'),
    enabled: false,
    staleTime: Infinity,
  });
}

export function useOrderInvoice() {
  return useMutation({
    mutationFn: (orderId: string) => request<InvoiceDownload>(`/billing/orders/${orderId}/invoice`),
  });
}

/** Fetch the mock invoice PDF and trigger a browser download. */
export async function downloadOrderInvoice(orderId: string): Promise<InvoiceDownload> {
  const meta = await request<InvoiceDownload>(`/billing/orders/${orderId}/invoice`);
  const token = getAuthToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${meta.url}`, { headers });
  if (!response.ok) {
    throw new Error('invoice_download_failed');
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = meta.filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
  return meta;
}

export async function openPayrexxPortal(): Promise<string> {
  const portal = await request<PayrexxPortal>('/checkout/payrexx-portal');
  window.open(portal.url, '_blank', 'noopener,noreferrer');
  return portal.url;
}
