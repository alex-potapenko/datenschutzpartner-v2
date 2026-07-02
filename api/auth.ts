import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

export const loginSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('validation.email'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export type LoginResponse = {
  token: string;
  email: string;
};

export const authKeys = {
  session: ['auth', 'session'] as const,
};

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  });
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
