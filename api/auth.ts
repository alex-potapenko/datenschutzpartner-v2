import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { setAuthToken } from '@/lib/auth-session';
import { request } from './client';

export const loginSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('validation.email'),
});

export const sessionSchema = z.object({
  email: z.email().nullable(),
  hasAcademyMembership: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type Session = z.infer<typeof sessionSchema>;

export type LoginResponse = {
  token: string;
  email: string;
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
