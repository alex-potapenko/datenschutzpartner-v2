import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { authKeys } from './auth';
import { accountKeys } from './account';
import { request } from './client';

/**
 * TOTP two-factor authentication. The same endpoints serve two entry points:
 * the signed-in account settings (Bearer token) and the e-mail setup link
 * (`setupToken` in the body), so both flows share one contract and one UI.
 */

export const twoFactorCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'validation.twoFactorCode'),
});
export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>;

export type TwoFactorStatus = {
  enabled: boolean;
  /** Policy: admin accounts must complete setup before they can sign in. */
  required: boolean;
  activatedAt: string | null;
  recoveryCodesRemaining: number;
  recoveryCodesTotal: number;
};

export type TwoFactorSetup = {
  secret: string;
  otpauthUri: string;
  issuer: string;
  accountName: string;
  /**
   * Prototype helper so the flow can be demoed without a phone — the mock
   * returns the code that is valid right now. A real backend never does.
   */
  prototypeCode?: string;
};

export type TwoFactorActivation = {
  status: TwoFactorStatus;
  recoveryCodes: string[];
};

/** Present for the e-mail setup link, absent when the user is signed in. */
type SetupTokenInput = { setupToken?: string };

export const twoFactorKeys = {
  status: ['account', 'two-factor'] as const,
};

function invalidateTwoFactor(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: twoFactorKeys.status });
  void queryClient.invalidateQueries({ queryKey: accountKeys.profile });
  void queryClient.invalidateQueries({ queryKey: authKeys.session });
}

/** Call after the user finishes a 2FA settings flow (e.g. saved new recovery codes). */
export function invalidateTwoFactorQueries(queryClient: ReturnType<typeof useQueryClient>) {
  invalidateTwoFactor(queryClient);
}

export function useTwoFactorStatus(enabled = true) {
  return useQuery({
    queryKey: twoFactorKeys.status,
    queryFn: () => request<TwoFactorStatus>('/account/two-factor'),
    enabled,
  });
}

export function useStartTwoFactorSetup() {
  return useMutation({
    mutationFn: (input: SetupTokenInput = {}) =>
      request<TwoFactorSetup>('/account/two-factor/setup', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useActivateTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TwoFactorCodeInput & SetupTokenInput) =>
      request<TwoFactorActivation>('/account/two-factor/activate', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateTwoFactor(queryClient);
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { password: string }) =>
      request<TwoFactorStatus>('/account/two-factor/disable', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateTwoFactor(queryClient);
    },
  });
}

export function useDismissTwoFactorSetupSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      request<{ ok: true }>('/account/two-factor/dismiss-setup-suggestion', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
}

export function useRegenerateRecoveryCodes() {
  return useMutation({
    mutationFn: (input: TwoFactorCodeInput) =>
      request<TwoFactorActivation>('/account/two-factor/recovery-codes', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}
