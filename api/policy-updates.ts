import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { documentKeys } from './documents';
import { questionnaireFormSchema } from './generator';
import { request } from './client';
import type { QuestionnaireFormData } from '@/app/result/content/questionnaire-form';
import { POLICY_SERVICE_CATEGORY_IDS } from '@/lib/policy-services/catalog';

/**
 * Policy maintenance domain — how a hosted privacy policy stays current.
 *
 * A policy is refreshed on a recurring automatic scan, on a member-triggered
 * manual scan (rate limited), or without any scan at all when the member edits
 * the basic information or the declared services.
 */

/** What triggered a policy revision. */
export const policyUpdateSourceSchema = z.enum([
  'automaticScan',
  'manualScan',
  'basicInformation',
  'services',
]);
export type PolicyUpdateSource = z.infer<typeof policyUpdateSourceSchema>;

/**
 * Operator-configurable maintenance rules. Served with the policy state so the
 * member area never hard-codes intervals or quotas.
 */
export const policyScanSettingsSchema = z.object({
  /** Days between two automatic scans. */
  automaticScanIntervalDays: z.number().int().positive(),
  /** Manual scans a member may trigger per rolling window. */
  manualScanLimit: z.number().int().nonnegative(),
  /** Length of the rolling window, in weeks. */
  manualScanWindowWeeks: z.number().int().positive(),
});
export type PolicyScanSettings = z.infer<typeof policyScanSettingsSchema>;

export const policyServiceSchema = z.object({
  id: z.string(),
  /** Entry in the shared service catalog. */
  catalogId: z.string(),
  name: z.string(),
  categoryId: z.enum(POLICY_SERVICE_CATEGORY_IDS),
  logoDomain: z.string().optional(),
  /** Found by the scanner, as opposed to added by the member. */
  detected: z.boolean(),
  /** Excluded from the policy — a false positive the member dismissed. */
  hidden: z.boolean(),
});
export type PolicyService = z.infer<typeof policyServiceSchema>;

export const policyServiceRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  note: z.string().optional(),
  requestedDate: z.string(),
  status: z.enum(['pending', 'accepted']),
});
export type PolicyServiceRequest = z.infer<typeof policyServiceRequestSchema>;

/**
 * The questionnaire answers behind a hosted policy — by definition everything
 * the website scanner cannot determine, so this is the "basic information"
 * members edit directly.
 */
export const policyBasicInformationSchema = questionnaireFormSchema;
export type PolicyBasicInformation = QuestionnaireFormData;

export const policyMaintenanceStateSchema = z.object({
  documentId: z.string(),
  createdDate: z.string(),
  /** Last revision of the hosted policy, whatever triggered it. */
  updatedDate: z.string(),
  /** What triggered that revision — a scan, or an edit without one. */
  lastUpdateSource: policyUpdateSourceSchema.nullable(),
  /** Last completed scan, automatic or manual. Null before the first scan. */
  lastScanDate: z.string().nullable(),
  settings: policyScanSettingsSchema,
  manualScansUsed: z.number().int().nonnegative(),
  manualScansRemaining: z.number().int().nonnegative(),
  /** When the rolling manual-scan window frees up the next slot. */
  manualScanWindowResetDate: z.string().nullable(),
  services: z.array(policyServiceSchema),
  serviceRequests: z.array(policyServiceRequestSchema),
  basicInformation: policyBasicInformationSchema,
});
export type PolicyMaintenanceState = Omit<
  z.infer<typeof policyMaintenanceStateSchema>,
  'basicInformation'
> & { basicInformation: PolicyBasicInformation };

export const manualScanResultSchema = z.object({
  /**
   * Refreshed maintenance state after the scan completes.
   *
   * When `changesFound` is true the backend must also revise the hosted policy:
   * `updatedDate` moves to today and `lastUpdateSource` becomes `manualScan`.
   * When false the policy text is unchanged — only scan metadata such as
   * `lastScanDate` and the manual-scan quota may advance.
   */
  state: policyMaintenanceStateSchema,
  /** Whether the scan found new services or other policy-relevant changes. */
  changesFound: z.boolean(),
});
export type ManualScanResult = z.infer<typeof manualScanResultSchema>;

export type PolicyServiceRequestCreate = {
  name: string;
  url?: string;
  note?: string;
};

export const policyMaintenanceKeys = {
  state: (documentId: string) => ['policy-maintenance', documentId] as const,
};

function statePath(documentId: string): string {
  return `/documents/${documentId}/policy-state`;
}

export function usePolicyMaintenance(documentId: string | null | undefined) {
  return useQuery({
    queryKey: policyMaintenanceKeys.state(documentId ?? ''),
    queryFn: () => request<PolicyMaintenanceState>(statePath(documentId ?? '')),
    enabled: Boolean(documentId),
  });
}

/** Invalidate the maintenance state and the document row that carries `updatedDate`. */
function useMaintenanceMutation<TInput>(
  documentId: string,
  send: (input: TInput) => Promise<PolicyMaintenanceState>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: send,
    onSuccess: (state) => {
      queryClient.setQueryData(policyMaintenanceKeys.state(documentId), state);
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      void queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });
    },
  });
}

export function useRunManualScan(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      request<ManualScanResult>(`${statePath(documentId)}/scan`, { method: 'POST' }),
    onSuccess: ({ state }) => {
      queryClient.setQueryData(policyMaintenanceKeys.state(documentId), state);
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      void queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });
    },
  });
}

export function useUpdatePolicyBasicInformation(documentId: string) {
  return useMaintenanceMutation<PolicyBasicInformation>(documentId, (input) =>
    request<PolicyMaintenanceState>(`${statePath(documentId)}/basic-information`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  );
}

export function useAddPolicyService(documentId: string) {
  return useMaintenanceMutation<string>(documentId, (catalogId) =>
    request<PolicyMaintenanceState>(`${statePath(documentId)}/services`, {
      method: 'POST',
      body: JSON.stringify({ catalogId }),
    })
  );
}

export function useSetPolicyServiceHidden(documentId: string) {
  return useMaintenanceMutation<{ serviceId: string; hidden: boolean }>(
    documentId,
    ({ serviceId, hidden }) =>
      request<PolicyMaintenanceState>(`${statePath(documentId)}/services/${serviceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ hidden }),
      })
  );
}

export function useRequestPolicyService(documentId: string) {
  return useMaintenanceMutation<PolicyServiceRequestCreate>(documentId, (input) =>
    request<PolicyMaintenanceState>(`${statePath(documentId)}/service-requests`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  );
}

export function useWithdrawPolicyServiceRequest(documentId: string) {
  return useMaintenanceMutation<string>(documentId, (requestId) =>
    request<PolicyMaintenanceState>(`${statePath(documentId)}/service-requests/${requestId}`, {
      method: 'DELETE',
    })
  );
}
