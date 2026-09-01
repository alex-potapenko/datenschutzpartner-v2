import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';
import { accountRoleSchema } from './account-role';

/**
 * Account domain — profile, billing address, and the membership snapshot shown on
 * the member-area dashboard. Server data only; UI state stays out of here.
 */

export const accountSnapshotSchema = z.object({
  documentCount: z.number(),
});
export type AccountSnapshot = z.infer<typeof accountSnapshotSchema>;

/** One billing address per account — used for all invoices and subscriptions. */
export const billingAddressSchema = z.object({
  firstName: z.string().min(1, 'validation.required'),
  lastName: z.string().min(1, 'validation.required'),
  company: z.string().optional(),
  line1: z.string().min(1, 'validation.required'),
  line2: z.string().optional(),
  postalCode: z.string().min(1, 'validation.required'),
  city: z.string().min(1, 'validation.required'),
  country: z.string().min(1, 'validation.required'),
  vatId: z.string().optional(),
  billingEmail: z.email('validation.email'),
});
export type BillingAddress = z.infer<typeof billingAddressSchema>;

/** @deprecated Legacy list shape — use {@link BillingAddress} via useBillingAddress. */
export const addressTypeEnum = z.enum(['billing', 'shipping']);
// eslint-disable-next-line @typescript-eslint/no-deprecated -- self-reference for the legacy export
export type AddressType = z.infer<typeof addressTypeEnum>;

/** @deprecated Legacy list shape — use {@link BillingAddress}. */
export const addressSchema = billingAddressSchema.extend({
  id: z.string(),
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- self-reference for the legacy export
  type: addressTypeEnum,
  label: z.string().optional(),
});
// eslint-disable-next-line @typescript-eslint/no-deprecated -- self-reference for the legacy export
export type Address = z.infer<typeof addressSchema>;

export { accountRoleSchema, type AccountRole } from './account-role';

export const profileSchema = z.object({
  firstName: z.string().min(1, 'validation.required'),
  lastName: z.string().min(1, 'validation.required'),
  displayName: z.string().min(1, 'validation.required'),
  email: z.email('validation.email'),
  newsletterOptIn: z.boolean().optional(),
  /** Read-only — drives login and security UI. */
  role: accountRoleSchema,
  /** Read-only — admins always sign in with 2FA in the prototype. */
  twoFactorEnabled: z.boolean().optional(),
});
export type Profile = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.required'),
    newPassword: z.string().min(8, 'validation.passwordMin'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.passwordMatch',
    path: ['confirmPassword'],
  });
export type PasswordChange = z.infer<typeof passwordChangeSchema>;

export const accountKeys = {
  snapshot: ['account', 'snapshot'] as const,
  billingAddress: ['account', 'billing-address'] as const,
  profile: ['account', 'profile'] as const,
};

export function useAccountSnapshot() {
  return useQuery({
    queryKey: accountKeys.snapshot,
    queryFn: () => request<AccountSnapshot>('/account/snapshot'),
  });
}

export function useBillingAddress() {
  return useQuery({
    queryKey: accountKeys.billingAddress,
    queryFn: () => request<BillingAddress | null>('/account/billing-address'),
  });
}

export function useUpdateBillingAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BillingAddress) =>
      request<BillingAddress>('/account/billing-address', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.billingAddress }),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: accountKeys.profile,
    queryFn: () => request<Profile>('/account/profile'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Profile) =>
      request<Profile>('/account/profile', { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.profile }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordChange) =>
      request<{ changed: true }>('/account/password', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
  });
}
