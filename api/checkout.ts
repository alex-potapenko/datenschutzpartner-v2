import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { accountKeys } from './account';
import { billingKeys } from './billing';
import { documentKeys, documentSchema, type GeneratorPlan } from './documents';
import { env } from '@/env';
import { getAuthToken } from '@/lib/auth-session';
import { request } from './client';

/**
 * Checkout domain — Payrexx-hosted payment sessions for the Privacy Policy
 * Generator (new policy or tier upgrade) and related side effects
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

export const GENERATOR_PLAN_IDS: GeneratorPlanId[] = ['single', 'team', 'agency'];

export function generatorPlanSiteCount(planId: GeneratorPlanId): number {
  return GENERATOR_PLAN_SITE_COUNTS[planId];
}

export function generatorPlanPrice(planId: GeneratorPlanId): number {
  return GENERATOR_PLAN_PRICES[planId];
}

const MS_PER_DAY = 86_400_000;

/** Higher site allowance = higher tier. */
export function compareGeneratorPlans(a: GeneratorPlanId, b: GeneratorPlanId): number {
  return GENERATOR_PLAN_SITE_COUNTS[a] - GENERATOR_PLAN_SITE_COUNTS[b];
}

function daysBetween(start: string, end: string): number {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.round((endMs - startMs) / MS_PER_DAY));
}

/** Credit for unused time on the active generator term (Option 1 upgrades). */
export function calculateGeneratorUpgradeCredit(input: {
  currentPlanId: GeneratorPlanId;
  lastOrderDate: string;
  nextPaymentDate: string;
  today?: string;
}): number {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  if (today >= input.nextPaymentDate) return 0;

  const termDays = Math.max(1, daysBetween(input.lastOrderDate, input.nextPaymentDate));
  const remainingDays = daysBetween(today, input.nextPaymentDate);
  const paid = GENERATOR_PLAN_PRICES[input.currentPlanId];

  return Math.round((remainingDays / termDays) * paid * 100) / 100;
}

export type GeneratorUpgradeQuote = {
  currentPlanId: GeneratorPlanId | null;
  targetPlanId: GeneratorPlanId;
  siteAllowance: number;
  listPrice: number;
  creditAmount: number;
  amountDue: number;
  isUpgrade: boolean;
};

export function calculateGeneratorUpgradeQuote(input: {
  targetPlanId: GeneratorPlanId;
  currentPlanId?: GeneratorPlanId | null;
  lastOrderDate?: string | null;
  nextPaymentDate?: string | null;
  today?: string;
}): GeneratorUpgradeQuote {
  const listPrice = GENERATOR_PLAN_PRICES[input.targetPlanId];
  const siteAllowance = GENERATOR_PLAN_SITE_COUNTS[input.targetPlanId];
  const currentPlanId = input.currentPlanId ?? null;

  if (!currentPlanId) {
    return {
      currentPlanId: null,
      targetPlanId: input.targetPlanId,
      siteAllowance,
      listPrice,
      creditAmount: 0,
      amountDue: listPrice,
      isUpgrade: false,
    };
  }

  const creditAmount =
    input.lastOrderDate && input.nextPaymentDate
      ? calculateGeneratorUpgradeCredit({
          currentPlanId,
          lastOrderDate: input.lastOrderDate,
          nextPaymentDate: input.nextPaymentDate,
          today: input.today,
        })
      : 0;

  return {
    currentPlanId,
    targetPlanId: input.targetPlanId,
    siteAllowance,
    listPrice,
    creditAmount,
    amountDue: Math.max(0, Math.round((listPrice - creditAmount) * 100) / 100),
    isUpgrade: compareGeneratorPlans(input.targetPlanId, currentPlanId) > 0,
  };
}

export function isGeneratorUpgradeAllowed(
  targetPlanId: GeneratorPlanId,
  currentPlanId: GeneratorPlanId | null | undefined,
  usedSiteCount: number
): boolean {
  const targetSites = GENERATOR_PLAN_SITE_COUNTS[targetPlanId];
  if (targetSites < usedSiteCount) return false;
  if (!currentPlanId) return true;
  return compareGeneratorPlans(targetPlanId, currentPlanId) > 0;
}

export type GeneratorPlanCheckoutState =
  | { status: 'available' }
  | { status: 'current' }
  | { status: 'unavailable'; reason: 'lowerTier' | 'insufficientSites' };

/** Upgrade checkout UI — every tier is shown; unavailable tiers carry a reason. */
export function getGeneratorPlanCheckoutState(
  targetPlanId: GeneratorPlanId,
  currentPlanId: GeneratorPlanId | null | undefined,
  usedSiteCount: number
): GeneratorPlanCheckoutState {
  if (currentPlanId && targetPlanId === currentPlanId) {
    return { status: 'current' };
  }

  const targetSites = GENERATOR_PLAN_SITE_COUNTS[targetPlanId];
  if (targetSites < usedSiteCount) {
    return { status: 'unavailable', reason: 'insufficientSites' };
  }

  if (currentPlanId && compareGeneratorPlans(targetPlanId, currentPlanId) < 0) {
    return { status: 'unavailable', reason: 'lowerTier' };
  }

  return { status: 'available' };
}

export function canUpgradeGeneratorPlan(
  currentPlanId: GeneratorPlanId | null | undefined,
  usedSiteCount: number
): boolean {
  return GENERATOR_PLAN_IDS.some((planId) =>
    isGeneratorUpgradeAllowed(planId, currentPlanId, usedSiteCount)
  );
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
  /** Full plan price before upgrade credit. */
  listPrice: z.number().optional(),
  /** Unused-term credit applied on tier upgrades. */
  creditAmount: z.number().optional(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const checkoutCompleteResultSchema = z.object({
  sessionId: z.string(),
  orderId: z.string(),
  document: documentSchema.optional(),
  siteAllowance: z.number().int().nonnegative(),
  planId: generatorPlanIdEnum.optional(),
  nextPaymentDate: z.string().nullable(),
  creditAmount: z.number().optional(),
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
    onSuccess: async (result) => {
      queryClient.setQueryData(documentKeys.plan, (current: GeneratorPlan | null | undefined) => ({
        siteAllowance: result.siteAllowance,
        planId: result.planId ?? current?.planId,
      }));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: documentKeys.plan }),
        queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: billingKeys.orders }),
        queryClient.invalidateQueries({ queryKey: accountKeys.snapshot }),
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
