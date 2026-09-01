import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { setAuthToken } from '@/lib/auth-session';
import { accountRoleSchema, type AccountRole } from './account-role';
import { euRepCheckoutEntitySchema } from './checkout';
import { request } from './client';

export { accountRoleSchema, type AccountRole } from './account-role';

export const loginIdentifySchema = z.object({
  email: z.email('validation.email'),
});

export const loginSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(1, 'validation.required'),
  twoFactorCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.email('validation.email'),
});

export const sessionSchema = z.object({
  email: z.email().nullable(),
  emailVerified: z.boolean(),
  role: accountRoleSchema.optional(),
});

export const registerSchema = z.object({
  email: z.email('validation.email'),
  acceptTerms: z.boolean().refine((value) => value, { message: 'validation.terms' }),
  newsletter: z.boolean(),
  domain: z.string().min(1),
  policyName: z.string().min(1).optional(),
  legalEntity: z.string().min(1).optional(),
  fillSubscriptionId: z.string().min(1).optional(),
  euRepEntityCount: z.number().int().positive().optional(),
  euRepEntities: z.array(euRepCheckoutEntitySchema).optional(),
  euRepLinkContractId: z.string().min(1).optional(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'validation.required'),
});

export type LoginIdentifyInput = z.infer<typeof loginIdentifySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export type LoginIdentifyResponse = {
  role: AccountRole;
};

export type LoginResponse = {
  token: string;
  email: string;
};

export type RegisterResponse = {
  status: 'pending_verification';
  email: string;
  /** Prototype helper — production sends this only by email. */
  verificationUrl: string;
};

export type VerifyEmailResponse = LoginResponse & {
  documentId?: string;
  domain?: string;
  /** Prototype helper — default password for newly verified member accounts. */
  prototypePassword?: string;
};

export const authKeys = {
  session: ['auth', 'session'] as const,
};

export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: () => request<Session>('/auth/session'),
    staleTime: 60_000,
  });
}

export function useIdentifyLogin() {
  return useMutation({
    mutationFn: (input: LoginIdentifyInput) =>
      request<LoginIdentifyResponse>('/auth/login/identify', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (data) => {
      setAuthToken(data.token);
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
}

/**
 * Protects member-only routes. Waits for any in-flight session refetch before
 * redirecting — stale `{ email: null }` cache from public pages must not win
 * over a token that was just stored at login.
 */
export function useRequireSession(returnTo?: string) {
  const router = useRouter();
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.email);
  const isChecking = session.isLoading || session.isFetching;

  useEffect(() => {
    if (isChecking || session.isError) return;
    if (isAuthenticated) return;

    const href = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login';
    router.replace(href);
  }, [isChecking, session.isError, isAuthenticated, router, returnTo]);

  return {
    session,
    isAuthenticated,
    isChecking: isChecking || !isAuthenticated,
  };
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      request<{ sent: true }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyEmailInput) =>
      request<VerifyEmailResponse>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      setAuthToken(data.token);
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
}
