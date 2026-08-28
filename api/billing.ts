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

/**
 * Which of the three monetized products a billing record belongs to. Every
 * subscription, membership row and order is tagged so the member area can
 * show billing/payment details scoped to the product the member is looking
 * at (Privacy Policy Generator, Datenschutz Academy, EU Rep) instead of one
 * undifferentiated billing cluster.
 */
export const billingProductTypeEnum = z.enum(['policy', 'academy', 'euRep']);
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
  /** Product-specific plan identifier — e.g. academy membership or eu-rep standard. */
  planId: z.string().optional(),
  /** Privacy Policy Generator — websites covered by this one subscription. */
  siteCount: z.number().int().positive().optional(),
  /** EU Representation — always 1; one subscription per legal-entity contract. */
  legalEntityCount: z.number().int().positive().optional(),
  status: billingStatusEnum,
  startDate: z.string(),
  lastOrderDate: z.string().nullable(),
  nextPaymentDate: z.string().nullable(),
  billingAddressId: z.string().optional(),
  totals: subscriptionTotalsSchema,
  relatedOrderIds: z.array(z.string()),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const membershipRowSchema = z.object({
  id: z.string(),
  productType: billingProductTypeEnum,
  plan: z.string(),
  startDate: z.string(),
  expiresDate: z.string().nullable(),
  status: billingStatusEnum,
  nextPaymentDate: z.string().nullable(),
});
export type MembershipRow = z.infer<typeof membershipRowSchema>;

export const orderKindEnum = z.enum(['subscription', 'renewal']);
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
  /** EU Representation — legal entities in this order (always 1 per contract). */
  legalEntityCount: z.number().int().positive().optional(),
  /** Volume discount amount applied to this order. */
  discountAmount: z.number().nonnegative().optional(),
  /** Volume discount rate applied to this order (0–0.1). */
  discountRate: z.number().nonnegative().optional(),
  /** Unique 5-digit billing id for this invoice. Never reused across invoices. */
  subscriptionId: z.string().optional(),
  /** Distinguishes a new subscription from a renewal invoice. */
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

export const billingKeys = {
  subscriptions: ['billing', 'subscriptions'] as const,
  subscription: (id: string) => ['billing', 'subscriptions', id] as const,
  memberships: ['billing', 'memberships'] as const,
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

export function useMemberships() {
  return useQuery({
    queryKey: billingKeys.memberships,
    queryFn: () => request<MembershipRow[]>('/billing/memberships'),
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
      void queryClient.invalidateQueries({ queryKey: billingKeys.memberships });
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
      void queryClient.invalidateQueries({ queryKey: billingKeys.memberships });
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

/** Legal entities covered by one EU Rep subscription. */
export function resolveEuRepEntityCount(subscription: Subscription): number {
  if (subscription.legalEntityCount && subscription.legalEntityCount > 0) {
    return subscription.legalEntityCount;
  }
  const fromPlan = Number(subscription.planId);
  return Number.isFinite(fromPlan) && fromPlan > 0 ? fromPlan : 1;
}
