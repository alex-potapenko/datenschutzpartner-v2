import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { billingKeys } from './billing';
import { documentKeys, documentSchema } from './documents';
import { env } from '@/env';
import { getAuthToken } from '@/lib/auth-session';
import { request } from './client';

/**
 * Checkout domain — Payrexx-hosted payment sessions for the Privacy Policy
 * Generator (new policy or mid-term site top-up) and related side effects
 * (orders, allowance, hosted document creation). Components never talk to
 * Payrexx directly; they create a session, redirect to `redirectUrl`, then
 * confirm completion via `useCompleteCheckoutSession`.
 */

export const generatorPlanIdEnum = z.enum(['single', 'team', 'agency']);
export type GeneratorPlanId = z.infer<typeof generatorPlanIdEnum>;

export const GENERATOR_PLAN_SITE_COUNTS: Record<GeneratorPlanId, number> = {
  single: 1,
  team: 3,
  agency: 5,
};

/** Yearly subscription prices (CHF, excl. VAT) — aligned with `generatorPage.plans.*`. */
export const GENERATOR_PLAN_PRICES: Record<GeneratorPlanId, number> = {
  single: 89,
  team: 199,
  agency: 279,
};

export function generatorPlanSiteCount(planId: GeneratorPlanId): number {
  return GENERATOR_PLAN_SITE_COUNTS[planId];
}

export function generatorPlanPrice(planId: GeneratorPlanId): number {
  return GENERATOR_PLAN_PRICES[planId];
}

export const checkoutKindEnum = z.enum(['generator', 'generatorTopUp']);
export type CheckoutKind = z.infer<typeof checkoutKindEnum>;

export const euRepCheckoutPlanIdEnum = z.enum(['budget', 'standard', 'premium']);
export type EuRepCheckoutPlanId = z.infer<typeof euRepCheckoutPlanIdEnum>;

export const checkoutSessionCreateSchema = z.object({
  kind: checkoutKindEnum,
  planId: generatorPlanIdEnum,
  /** Covered website when purchasing through the generator wizard. */
  domain: z.string().min(1).optional(),
  policyName: z.string().min(1).optional(),
  /** Bundled EU representation plan selected on the eu-rep step. */
  euRepPlanId: euRepCheckoutPlanIdEnum.optional(),
});
export type CheckoutSessionCreate = z.infer<typeof checkoutSessionCreateSchema>;

export const checkoutSessionSchema = z.object({
  id: z.string(),
  /** Payrexx hosted checkout URL — open in the same tab in production. */
  redirectUrl: z.string(),
  amount: z.number(),
  currency: z.string(),
  siteCount: z.number().int().positive(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const checkoutCompleteResultSchema = z.object({
  sessionId: z.string(),
  orderId: z.string(),
  document: documentSchema.optional(),
  siteAllowance: z.number().int().nonnegative(),
  nextPaymentDate: z.string().nullable(),
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

export const checkoutKeys = {
  payrexxPortal: ['checkout', 'payrexx-portal'] as const,
};

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      void queryClient.invalidateQueries({ queryKey: documentKeys.plan });
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions });
      void queryClient.invalidateQueries({ queryKey: billingKeys.orders });
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
