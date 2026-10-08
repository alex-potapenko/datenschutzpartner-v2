import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { personNameField } from '@/lib/validation/fields';
import { setAuthToken } from '@/lib/auth-session';
import { accountRoleSchema, type AccountRole } from './account-role';
import { euRepCheckoutEntitySchema, euRepPlanIdSchema } from './checkout';
import { request } from './client';

export { accountRoleSchema, type AccountRole } from './account-role';

export const loginIdentifySchema = z.object({
  email: z.email('validation.email'),
});

export const loginSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(1, 'validation.required'),
  twoFactorCode: z.string().optional(),
  /** One-time code used when the authenticator app is unavailable. */
  recoveryCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.email('validation.email'),
});

export const sessionSchema = z.object({
  email: z.email().nullable(),
  emailVerified: z.boolean(),
  role: accountRoleSchema.optional(),
  suggestTwoFactorSetup: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    email: z.email('validation.email'),
    firstName: personNameField,
    lastName: personNameField,
    acceptTerms: z.boolean().refine((value) => value, { message: 'validation.terms' }),
    newsletter: z.boolean(),
    domain: z.string().optional(),
    policyName: z.string().min(1).optional(),
    legalEntity: z.string().min(1).optional(),
    fillSubscriptionId: z.string().min(1).optional(),
    euRepEntityCount: z.number().int().positive().optional(),
    euRepPlanId: euRepPlanIdSchema.optional(),
    euRepEntities: z.array(euRepCheckoutEntitySchema).optional(),
    euRepLinkContractId: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      Boolean(data.domain?.trim()) || Boolean(data.euRepEntityCount || data.euRepEntities?.length),
    { message: 'validation.required', path: ['domain'] }
  );

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'validation.required'),
});

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'validation.passwordMin'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMatch',
    path: ['confirmPassword'],
  });
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export type LoginIdentifyInput = z.infer<typeof loginIdentifySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const magicLinkLoginSchema = z.object({
  token: z.string().min(1, 'validation.required'),
});

export type MagicLinkLoginInput = z.infer<typeof magicLinkLoginSchema>;

export type LoginIdentifyResponse = {
  loginMethod: 'password' | 'magic_link';
  role?: AccountRole;
  requiresTwoFactor?: boolean;
  twoFactorSetupRequired?: boolean;
  /** Prototype helper — production sends the link by e-mail only. */
  prototypeMagicLinkUrl?: string;
};

export type LoginResponse = {
  email: string;
  /** Absent while two-factor setup is still outstanding. */
  token?: string;
  /** The account must configure an authenticator before it gets a session. */
  twoFactorSetupRequired?: boolean;
  /** Short-lived token that authorises the setup flow without a session. */
  setupToken?: string;
  /** Member may configure 2FA voluntarily (e.g. first sign-in). */
  suggestTwoFactorSetup?: boolean;
};

export type ForgotPasswordResponse = {
  sent: true;
  /** Prototype helper — production delivers this link by e-mail only. */
  prototypeSetupUrl?: string;
};

export type InviteValidation = {
  email: string;
  needsPassword: boolean;
  twoFactorRequired: boolean;
  twoFactorEnabled: boolean;
};

export type RegisterResponse = {
  status: 'pending_verification';
  email: string;
  /** Prototype helper — production sends this only by email. */
  verificationUrl: string;
};

export type VerifyEmailResponse = LoginResponse & {
  /** Verification always yields a session — 2FA is configured later. */
  token: string;
  documentId?: string;
  domain?: string;
  redirectTo?: string;
  /** Prototype helper — default password for newly verified member accounts. */
  prototypePassword?: string;
};

export const authKeys = {
  session: ['auth', 'session'] as const,
  invite: ['auth', 'invite'] as const,
};

export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: () => request<Session>('/auth/session'),
    staleTime: 60_000,
  });
}

/** Prototype only — restores MSW auth accounts to seed data. */
export function useReseedAuthMock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      request<{ ok: true }>('/dev/reseed-auth-mock', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
      void queryClient.invalidateQueries({ queryKey: ['account', 'two-factor'] });
    },
  });
}

/** Prototype only — clears two-factor on the Lucas member seed account. */
export function useDisableLucasTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      request<{ ok: true }>('/dev/disable-lucas-two-factor', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
      void queryClient.invalidateQueries({ queryKey: ['account', 'two-factor'] });
    },
  });
}

/** Prototype only — clears two-factor on the admin seed account (lost authenticator). */
export function useResetAdminTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      request<{ ok: true }>('/dev/reset-admin-two-factor', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
      void queryClient.invalidateQueries({ queryKey: ['account', 'two-factor'] });
    },
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
      if (!data.token) return;
      setAuthToken(data.token);
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
}

const magicLinkLoginInflight = new Map<string, Promise<LoginResponse>>();

/** Single in-flight magic-link exchange per token (React Strict Mode runs effects twice). */
export function consumeMagicLinkLogin(token: string): Promise<LoginResponse> {
  const normalized = token.trim();
  const existing = magicLinkLoginInflight.get(normalized);
  if (existing) return existing;

  const promise = request<LoginResponse>('/auth/login/magic-link', {
    method: 'POST',
    body: JSON.stringify({ token: normalized }),
  }).then((data) => {
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  });

  magicLinkLoginInflight.set(normalized, promise);
  return promise;
}

export function useMagicLinkLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MagicLinkLoginInput) => consumeMagicLinkLogin(input.token),
    onSuccess: (data) => {
      if (!data.token) return;
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
      request<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useInviteValidation(token: string) {
  return useQuery({
    queryKey: [...authKeys.invite, token],
    queryFn: () =>
      request<InviteValidation>('/auth/invite/validate', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    enabled: token.length > 0,
    retry: false,
  });
}

/** Stores the password (when one is needed) and exchanges the invite for a session. */
export function useCompleteInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { token: string; password?: string }) =>
      request<LoginResponse>('/auth/invite/complete', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      if (!data.token) return;
      setAuthToken(data.token);
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
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
