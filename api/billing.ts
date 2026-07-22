import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

/**
 * Billing domain — subscriptions, memberships, orders and payment methods
 * shown across the member area's Billing cluster.
 */

export const billingStatusEnum = z.enum(['active', 'processing', 'cancelled']);
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

export const orderKindEnum = z.enum(['subscription', 'extraInquiry']);
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
   * Privacy Policy Generator orders — number of websites purchased. Each order
   * adds to the running `siteAllowance` and, on payment, resets the active
   * `policy` subscription renewal to +12 months from that order's date.
   */
  siteCount: z.number().int().positive().optional(),
  /** Distinguishes the base subscription from add-on purchases such as extra EU Rep inquiries. */
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
  memberships: ['billing', 'memberships'] as const,
  orders: ['billing', 'orders'] as const,
};

export function useSubscriptions() {
  return useQuery({
    queryKey: billingKeys.subscriptions,
    queryFn: () => request<Subscription[]>('/billing/subscriptions'),
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
