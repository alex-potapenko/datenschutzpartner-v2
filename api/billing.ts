import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { documentKeys } from './documents';
import { euRepKeys } from './eu-rep';
import { request } from './client';

/**
 * Billing domain — subscriptions, memberships, orders and payment methods
 * shown across the member area's Billing cluster.
 */

export const billingStatusEnum = z.enum(['active', 'processing', 'cancelled', 'expired']);
export type BillingStatus = z.infer<typeof billingStatusEnum>;

/** Billing billing records for Privacy Policy Generator and EU Rep in the member area. */
export const billingProductTypeEnum = z.enum(['policy', 'euRep']);
export type BillingProductType = z.infer<typeof billingProductTypeEnum>;

export const subscriptionTotalsSchema = z.object({
  product: z.string(),
  subtotal: z.number(),
  discount: z.number(),
  total: z.number(),
  currency: z.string(),
});

export const subscriptionSchema = z.object({
  id: z.string(),
  productType: billingProductTypeEnum,
  product: z.string(),
  /** Product-specific plan identifier — e.g. policy site count or EU plan `basis`/`plus`/`plus5`. */
  planId: z.string().optional(),
  /** Privacy Policy Generator — websites covered by this one subscription. */
  siteCount: z.number().int().positive().optional(),
  /** EU Representation — number of legal entities currently on this plan subscription. */
  legalEntityCount: z.number().int().positive().optional(),
  /** EU Representation — included payable inquiries per year (from plan). */
  includedRequests: z.number().int().nonnegative().optional(),
  /** EU Representation — inquiries already billed / used this term. */
  usedRequests: z.number().int().nonnegative().optional(),
  status: billingStatusEnum,
  startDate: z.string(),
  lastOrderDate: z.string().nullable(),
  nextPaymentDate: z.string().nullable(),
  /** ISO date the free policy trial ends. Absent when the subscription is already paid. */
  trialEndsAt: z.string().optional(),
  billingAddressId: z.string().optional(),
  totals: subscriptionTotalsSchema,
  relatedOrderIds: z.array(z.string()),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const orderKindEnum = z.enum(['subscription', 'renewal', 'extraRequest']);
export type OrderKind = z.infer<typeof orderKindEnum>;

export const orderSchema = z.object({
  id: z.string(),
  productType: billingProductTypeEnum,
  number: z.string(),
  date: z.string(),
  status: billingStatusEnum,
  total: z.number(),
  currency: z.string(),
  /**
   * Privacy Policy Generator — websites in this order (all sites on that
   * subscription share one rate; the discount is never split inside the order).
   */
  siteCount: z.number().int().positive().optional(),
  /** EU Representation — legal entities in this order. */
  legalEntityCount: z.number().int().positive().optional(),
  /** EU Representation plan id when this is a plan subscription / extra-request invoice. */
  planId: z.string().optional(),
  /** Volume discount amount applied to this order. */
  discountAmount: z.number().nonnegative().optional(),
  /** Volume discount rate applied to this order (0–0.1). */
  discountRate: z.number().nonnegative().optional(),
  /** Unique 5-digit billing id for this invoice. Never reused across invoices. */
  subscriptionId: z.string().optional(),
  /** Distinguishes a new subscription, renewal, or payable inquiry invoice. */
  orderKind: orderKindEnum.optional(),
});
export type Order = z.infer<typeof orderSchema>;

/**
 * Payments are handled entirely by Payrexx (hosted checkout). The member area
 * never stores or displays card details — updating a payment method happens on
 * Payrexx, not in this app — so there is no payment-method resource here. Only
 * the billing address is assignable per subscription.
 */
export const subscriptionBillingUpdateSchema = z.object({
  billingAddressId: z.string().optional(),
});
export type SubscriptionBillingUpdate = z.infer<typeof subscriptionBillingUpdateSchema>;

export const euRepExtraRequestCreateSchema = z.object({
  subscriptionId: z.string().min(1),
  /** Optional representation this inquiry relates to. */
  contractId: z.string().min(1).optional(),
});
export type EuRepExtraRequestCreate = z.infer<typeof euRepExtraRequestCreateSchema>;

export const billingKeys = {
  subscriptions: ['billing', 'subscriptions'] as const,
  subscription: (id: string) => ['billing', 'subscriptions', id] as const,
  orders: ['billing', 'orders'] as const,
};

export function useSubscriptions() {
  return useQuery({
    queryKey: billingKeys.subscriptions,
    queryFn: () => request<Subscription[]>('/billing/subscriptions'),
  });
}

export function useSubscription(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: billingKeys.subscription(id),
    queryFn: () => request<Subscription>(`/billing/subscriptions/${id}`),
    enabled: Boolean(id),
    // Client navigation from the member area already has the list in cache —
    // show that row immediately so the detail page is never an empty shell
    // while GET /billing/subscriptions/:id is in flight (or skipped by MSW).
    placeholderData: () =>
      queryClient
        .getQueryData<Subscription[]>(billingKeys.subscriptions)
        ?.find((row) => row.id === id),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: billingKeys.orders,
    queryFn: () => request<Order[]>('/billing/orders'),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<Subscription>(`/billing/subscriptions/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions });
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      void queryClient.invalidateQueries({ queryKey: euRepKeys.contracts });
    },
  });
}

export function useContinueSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<Subscription>(`/billing/subscriptions/${id}/continue`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions });
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      void queryClient.invalidateQueries({ queryKey: euRepKeys.contracts });
    },
  });
}

export function useUpdateSubscriptionBilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubscriptionBillingUpdate }) =>
      request<Subscription>(`/billing/subscriptions/${id}/billing`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions }),
  });
}

/** Bill CHF 99 for a payable EU Rep inquiry beyond the plan allowance. */
export function useCreateEuRepExtraRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EuRepExtraRequestCreate) =>
      request<Order>('/billing/eu-rep/extra-request', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.orders });
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions });
    },
  });
}

export function listPolicySubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions
    .filter((row) => row.productType === 'policy')
    .slice()
    .sort((a, b) => {
      const statusRank: Record<string, number> = {
        active: 0,
        processing: 1,
        expired: 2,
        cancelled: 3,
      };
      const rankA = statusRank[a.status] ?? 9;
      const rankB = statusRank[b.status] ?? 9;
      if (rankA !== rankB) return rankA - rankB;
      return (a.nextPaymentDate ?? a.startDate).localeCompare(b.nextPaymentDate ?? b.startDate);
    });
}

export function countActivePolicySubscriptions(subscriptions: Subscription[]): number {
  return subscriptions.filter((row) => row.productType === 'policy' && row.status === 'active')
    .length;
}

/** Websites covered by currently active policy subscriptions. */
export function countActivePolicySites(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((row) => row.productType === 'policy' && row.status === 'active')
    .reduce((sum, row) => sum + resolvePolicySiteCount(row), 0);
}

/** Sites covered by one policy subscription (`siteCount`, else numeric `planId`). */
export function resolvePolicySiteCount(subscription: Subscription): number {
  if (subscription.siteCount && subscription.siteCount > 0) {
    return subscription.siteCount;
  }
  const fromPlan = Number(subscription.planId);
  return Number.isFinite(fromPlan) && fromPlan > 0 ? fromPlan : 1;
}

/** Soonest-renewing active policy subscription, falling back to any policy row. */
export function resolveSoonestPolicySubscription(
  subscriptions: Subscription[]
): Subscription | undefined {
  const policy = listPolicySubscriptions(subscriptions);
  return policy.find((row) => row.status === 'active') ?? policy[0];
}

export function listEuRepSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions
    .filter((row) => row.productType === 'euRep')
    .slice()
    .sort((a, b) => {
      const statusRank: Record<string, number> = {
        active: 0,
        processing: 1,
        expired: 2,
        cancelled: 3,
      };
      const rankA = statusRank[a.status] ?? 9;
      const rankB = statusRank[b.status] ?? 9;
      if (rankA !== rankB) return rankA - rankB;
      return (a.nextPaymentDate ?? a.startDate).localeCompare(b.nextPaymentDate ?? b.startDate);
    });
}

/** Legal entities covered by currently active EU Rep subscriptions. */
export function countActiveEuRepEntities(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((row) => row.productType === 'euRep' && row.status === 'active')
    .reduce((sum, row) => sum + resolveEuRepEntityCount(row), 0);
}

/** Legal entities covered by one EU Rep subscription (count of linked contracts wins). */
export function resolveEuRepEntityCount(subscription: Subscription): number {
  if (subscription.legalEntityCount && subscription.legalEntityCount > 0) {
    return subscription.legalEntityCount;
  }
  return 1;
}

/** Remaining included inquiries on an EU Rep plan this term. */
export function resolveEuRepRemainingRequests(subscription: Subscription): number {
  const included = subscription.includedRequests ?? 0;
  const used = subscription.usedRequests ?? 0;
  return Math.max(0, included - used);
}

function todayIsoDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Active billing records that still grant product access (trial counts as active). */
export function isActiveSubscription(subscription: Subscription | null | undefined): boolean {
  return subscription?.status === 'active' || subscription?.status === 'processing';
}

/** Whether a subscription is still in its unpaid trial window. */
export function isSubscriptionOnTrial(
  subscription: Subscription | undefined,
  now = new Date()
): boolean {
  if (!subscription) return false;
  const today = todayIsoDate(now);
  return (
    subscription.status === 'active' &&
    Boolean(subscription.trialEndsAt) &&
    (subscription.trialEndsAt ?? '') >= today
  );
}

/** Whether a single policy subscription is still in its unpaid trial window. */
export function isPolicySubscriptionOnTrial(
  subscription: Subscription | undefined,
  now = new Date()
): boolean {
  return subscription?.productType === 'policy' && isSubscriptionOnTrial(subscription, now);
}

/** Whether a single EU Rep subscription is still in its unpaid trial window. */
export function isEuRepSubscriptionOnTrial(
  subscription: Subscription | undefined,
  now = new Date()
): boolean {
  return subscription?.productType === 'euRep' && isSubscriptionOnTrial(subscription, now);
}

/** Trial end while unpaid; otherwise the next renewal date. */
export function subscriptionCoverageEnd(
  subscription: Subscription | undefined,
  now = new Date()
): string | undefined {
  if (!subscription) return undefined;
  if (isSubscriptionOnTrial(subscription, now)) return subscription.trialEndsAt;
  return subscription.nextPaymentDate ?? undefined;
}

/** Active policy subscriptions that are still in the unpaid trial window. */
export function listTrialPolicySubscriptions(
  subscriptions: Subscription[],
  now = new Date()
): Subscription[] {
  return subscriptions.filter((row) => isPolicySubscriptionOnTrial(row, now));
}

export function hasActivePolicyTrial(subscriptions: Subscription[], now = new Date()): boolean {
  return listTrialPolicySubscriptions(subscriptions, now).length > 0;
}
