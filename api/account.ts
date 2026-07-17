import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

/**
 * Account domain — profile, addresses, and the membership snapshot shown on
 * the member-area dashboard. Server data only; UI state stays out of here.
 */

export const membershipStatusEnum = z.enum(['active', 'processing', 'cancelled', 'none']);
export type MembershipStatus = z.infer<typeof membershipStatusEnum>;

export const membershipSummarySchema = z.object({
  status: membershipStatusEnum,
  subscriptionDate: z.string().nullable(),
  renewalDate: z.string().nullable(),
});
export type MembershipSummary = z.infer<typeof membershipSummarySchema>;

export const accountSnapshotSchema = z.object({
  membership: membershipSummarySchema,
  nextLiveSessionAt: z.string().nullable(),
  documentCount: z.number(),
  /** EU Rep included inquiry allowance — null when the member has no EU Rep plan. */
  euRepInquiryAllowance: z
    .object({
      included: z.number().int().nonnegative(),
      used: z.number().int().nonnegative(),
      furtherInquiryAmount: z.number().nonnegative(),
      currency: z.string(),
    })
    .nullable(),
});
export type AccountSnapshot = z.infer<typeof accountSnapshotSchema>;

export const addressTypeEnum = z.enum(['billing', 'shipping']);
export type AddressType = z.infer<typeof addressTypeEnum>;

export const addressSchema = z.object({
  id: z.string(),
  type: addressTypeEnum,
  /** Optional label shown in address lists — e.g. "Head office". */
  label: z.string().optional(),
  firstName: z.string().min(1, 'validation.required'),
  lastName: z.string().min(1, 'validation.required'),
  company: z.string().optional(),
  line1: z.string().min(1, 'validation.required'),
  line2: z.string().optional(),
  postalCode: z.string().min(1, 'validation.required'),
  city: z.string().min(1, 'validation.required'),
  country: z.string().min(1, 'validation.required'),
  /** Swiss VAT number shown on invoices and in the billing sidebar. */
  vatId: z.string().optional(),
});
export const addressInputSchema = addressSchema.omit({ id: true });
export const addressUpdateSchema = addressInputSchema.partial();
export type Address = z.infer<typeof addressSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
export type AddressUpdate = z.infer<typeof addressUpdateSchema>;

export const profileSchema = z.object({
  firstName: z.string().min(1, 'validation.required'),
  lastName: z.string().min(1, 'validation.required'),
  displayName: z.string().min(1, 'validation.required'),
  email: z.email('validation.email'),
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
  addresses: ['account', 'addresses'] as const,
  profile: ['account', 'profile'] as const,
};

export function useAccountSnapshot() {
  return useQuery({
    queryKey: accountKeys.snapshot,
    queryFn: () => request<AccountSnapshot>('/account/snapshot'),
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: accountKeys.addresses,
    queryFn: () => request<Address[]>('/account/addresses'),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) =>
      request<Address>('/account/addresses', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddressUpdate }) =>
      request<Address>(`/account/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<undefined>(`/account/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses }),
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
