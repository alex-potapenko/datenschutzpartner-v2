import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

/**
 * Billing domain — subscriptions, memberships, orders and payment methods
 * shown across the member area's Billing cluster.
 */

export const billingStatusEnum = z.enum(['active', 'processing', 'updateAvailable', 'cancelled']);
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
  /** @deprecated Prefer paymentMethodId + payment-methods endpoint for card details. */
  paymentMethod: z.string(),
  paymentMethodId: z.string().optional(),
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
  /** Privacy Policy Generator orders — number of websites covered by the plan. */
  siteCount: z.number().int().positive().optional(),
  /** Distinguishes the base subscription from add-on purchases such as extra EU Rep inquiries. */
  orderKind: orderKindEnum.optional(),
});
export type Order = z.infer<typeof orderSchema>;

export const paymentMethodTypeEnum = z.enum(['card', 'invoice']);
export type PaymentMethodType = z.infer<typeof paymentMethodTypeEnum>;

export const paymentCardBrandEnum = z.enum(['visa', 'mastercard', 'maestro']);
export type PaymentCardBrand = z.infer<typeof paymentCardBrandEnum>;

export const paymentMethodSchema = z.object({
  id: z.string(),
  type: paymentMethodTypeEnum,
  label: z.string(),
  cardholderName: z.string().optional(),
  brand: paymentCardBrandEnum.optional(),
  last4: z.string().optional(),
  expMonth: z.number().int().min(1).max(12).optional(),
  expYear: z.number().int().optional(),
  /** Set once the card is tokenized via Payrexx (or another PSP). */
  provider: z.enum(['payrexx']).optional(),
  externalId: z.string().optional(),
});
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

const cardExpiryMonthSchema = z
  .number('validation.required')
  .int('validation.required')
  .min(1, 'validation.required')
  .max(12, 'validation.required');

const cardExpiryYearSchema = z
  .number('validation.required')
  .int('validation.required')
  .min(new Date().getFullYear(), 'validation.required');

/** Stored-card updates — expiry and cardholder name only (no PAN/CVV). */
export const paymentMethodUpdateInputSchema = z.object({
  type: z.literal('card'),
  cardholderName: z.string('validation.required').min(1, 'validation.required'),
  expMonth: cardExpiryMonthSchema,
  expYear: cardExpiryYearSchema,
});
export type PaymentMethodUpdateInput = z.infer<typeof paymentMethodUpdateInputSchema>;

/**
 * POC create payload — simulates a Payrexx tokenization round-trip. The mock
 * handler derives `last4`/`brand` and discards PAN + CVV. Production replaces
 * this with `useCreatePaymentMethodFromPayrexx` after the Payrexx widget returns
 * a token (see `payrexxPaymentMethodSessionSchema`).
 */
export const paymentMethodCreateInputSchema = z.object({
  type: z.literal('card'),
  cardholderName: z.string('validation.required').min(1, 'validation.required'),
  cardNumber: z
    .string('validation.required')
    .min(1, 'validation.required')
    .transform((value) => value.replace(/\s/g, ''))
    .refine((value) => /^\d{13,19}$/.test(value), { message: 'validation.cardNumber' }),
  cvv: z.string('validation.required').regex(/^\d{3,4}$/, 'validation.cvv'),
  expMonth: cardExpiryMonthSchema,
  expYear: cardExpiryYearSchema,
});
export type PaymentMethodCreateInput = z.infer<typeof paymentMethodCreateInputSchema>;

/** @deprecated Use paymentMethodCreateInputSchema or paymentMethodUpdateInputSchema. */
export const paymentMethodInputSchema = paymentMethodUpdateInputSchema;
/** @deprecated Use PaymentMethodCreateInput or PaymentMethodUpdateInput. */
export type PaymentMethodInput = PaymentMethodUpdateInput;

/** Payrexx tokenization session — backend creates this via Payrexx API. */
export const payrexxPaymentMethodSessionSchema = z.object({
  sessionId: z.string(),
  checkoutUrl: z.url(),
  expiresAt: z.string(),
});
export type PayrexxPaymentMethodSession = z.infer<typeof payrexxPaymentMethodSessionSchema>;

/** Production create body after Payrexx.js / hosted page returns a token. */
export const paymentMethodFromPayrexxInputSchema = z.object({
  payrexxToken: z.string().min(1, 'validation.required'),
});
export type PaymentMethodFromPayrexxInput = z.infer<typeof paymentMethodFromPayrexxInputSchema>;

export function normalizeCardNumber(value: string) {
  return value.replace(/\s/g, '');
}

export function detectCardBrand(cardNumber: string): PaymentCardBrand | undefined {
  const digits = normalizeCardNumber(cardNumber);
  if (digits.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  if (/^(5018|5020|5038|6304|6759|6761|6763)/.test(digits)) return 'maestro';
  return undefined;
}

export const subscriptionBillingUpdateSchema = z.object({
  paymentMethodId: z.string().optional(),
  billingAddressId: z.string().optional(),
});
export type SubscriptionBillingUpdate = z.infer<typeof subscriptionBillingUpdateSchema>;

export const billingKeys = {
  subscriptions: ['billing', 'subscriptions'] as const,
  memberships: ['billing', 'memberships'] as const,
  orders: ['billing', 'orders'] as const,
  paymentMethods: ['billing', 'payment-methods'] as const,
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

export function usePaymentMethods() {
  return useQuery({
    queryKey: billingKeys.paymentMethods,
    queryFn: () => request<PaymentMethod[]>('/billing/payment-methods'),
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

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentMethodCreateInput) =>
      request<PaymentMethod>('/billing/payment-methods', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.paymentMethods }),
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PaymentMethodUpdateInput }) =>
      request<PaymentMethod>(`/billing/payment-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.paymentMethods }),
  });
}

/** Starts a Payrexx tokenization session (hosted page / widget). POC returns a mock URL. */
export function usePayrexxPaymentMethodSession() {
  return useMutation({
    mutationFn: () =>
      request<PayrexxPaymentMethodSession>('/billing/payment-methods/payrexx-session', {
        method: 'POST',
      }),
  });
}

/** Production path — persist a card alias from a Payrexx token. */
export function useCreatePaymentMethodFromPayrexx() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentMethodFromPayrexxInput) =>
      request<PaymentMethod>('/billing/payment-methods/from-payrexx', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.paymentMethods }),
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<undefined>(`/billing/payment-methods/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.paymentMethods }),
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
