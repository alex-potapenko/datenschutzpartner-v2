import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { Subscription } from './billing';
import { documentKeys, uniqueDocumentsBySite, type GeneratedDocument } from './documents';
import { request } from './client';

/**
 * EU Representation contracts — coverage for one **Swiss** legal entity per
 * year. The EU representative itself is always
 * {@link EU_REP_REPRESENTATIVE} (VGS Datenschutzpartner GmbH, Hamburg).
 * A member may hold several contracts (an agency with two Swiss clients =
 * two contracts). `legalEntity` is the represented Swiss company, not an
 * EU-side entity. `forwardingEmail` is operational only; it is never printed
 * in the policy.
 */

/** Public Art. 27 address inserted into linked hosted policies (AGB §2.3). */
export const EU_REP_REPRESENTATIVE = {
  name: 'VGS Datenschutzpartner GmbH',
  street: 'Am Kaiserkai 69',
  postalCode: '20457',
  city: 'Hamburg',
  email: 'info@datenschutzpartner.eu',
  website: 'https://datenschutzpartner.eu/',
} as const;

export const euRepContractStatusEnum = z.enum(['active', 'cancelled']);
export type EuRepContractStatus = z.infer<typeof euRepContractStatusEnum>;

export const euRepContractSchema = z.object({
  id: z.string(),
  /** Billing subscription that covers this legal-entity slot. */
  subscriptionId: z.string(),
  /** Swiss organisation this contract represents (the controller). */
  legalEntity: z.string().min(1, 'validation.required'),
  /** Internal inbox for supervisory and data-subject mail — not shown on the policy. */
  forwardingEmail: z.email('validation.email'),
  /** Hosted generator documents that currently include the Hamburg block. */
  linkedDocumentIds: z.array(z.string()),
  status: euRepContractStatusEnum,
});
export type EuRepContract = z.infer<typeof euRepContractSchema>;

export const euRepContractUpdateSchema = euRepContractSchema.pick({
  legalEntity: true,
  forwardingEmail: true,
});
export type EuRepContractUpdate = z.infer<typeof euRepContractUpdateSchema>;

export const euRepLinkDocumentsSchema = z.object({
  documentIds: z.array(z.string().min(1)).min(1),
});
export type EuRepLinkDocuments = z.infer<typeof euRepLinkDocumentsSchema>;

export function resolveEuRepContract(
  contracts: readonly EuRepContract[],
  document: { euRepContractId?: string }
): EuRepContract | undefined {
  if (!document.euRepContractId) return undefined;
  return contracts.find((row) => row.id === document.euRepContractId);
}

/** The legal-entity contract billed on this subscription (1:1). */
export function resolveEuRepContractForSubscription(
  contracts: readonly EuRepContract[],
  subscriptionId: string
): EuRepContract | undefined {
  return contracts.find((row) => row.subscriptionId === subscriptionId);
}

function normalizeLegalEntityName(value: string): string {
  return value.trim().toLowerCase();
}

/** Active contract for the Swiss legal entity named on the questionnaire. */
export function findEuRepContractForLegalEntity(
  contracts: readonly EuRepContract[],
  legalEntity: string
): EuRepContract | undefined {
  const needle = normalizeLegalEntityName(legalEntity);
  if (!needle) return undefined;
  return contracts.find(
    (row) => row.status === 'active' && normalizeLegalEntityName(row.legalEntity) === needle
  );
}

const SUBSCRIPTION_STATUS_ORDER: Record<string, number> = {
  active: 0,
  processing: 1,
  expired: 2,
  cancelled: 3,
};

export type EuRepSubscriptionGroup = {
  contract: EuRepContract;
  subscription?: Subscription;
  documents: GeneratedDocument[];
};

export function linkedDocumentsForContract(
  contract: EuRepContract,
  documents: readonly GeneratedDocument[]
): GeneratedDocument[] {
  const linkedIds = new Set(contract.linkedDocumentIds);
  return uniqueDocumentsBySite(
    documents.filter((doc) => linkedIds.has(doc.id) || doc.euRepContractId === contract.id)
  ).sort((a, b) => a.createdDate.localeCompare(b.createdDate));
}

/** Group EU Rep contracts by their billing subscription, like generator policies. */
export function groupEuRepContractsBySubscription(
  contracts: readonly EuRepContract[],
  subscriptions: readonly Subscription[],
  documents: readonly GeneratedDocument[]
): EuRepSubscriptionGroup[] {
  const byId = new Map(subscriptions.map((row) => [row.id, row]));
  return contracts
    .filter((row) => row.status !== 'cancelled')
    .map((contract) => ({
      contract,
      subscription: byId.get(contract.subscriptionId),
      documents: linkedDocumentsForContract(contract, documents),
    }))
    .sort((a, b) => {
      const statusA = SUBSCRIPTION_STATUS_ORDER[a.subscription?.status ?? ''] ?? 9;
      const statusB = SUBSCRIPTION_STATUS_ORDER[b.subscription?.status ?? ''] ?? 9;
      if (statusA !== statusB) return statusA - statusB;
      return a.contract.subscriptionId.localeCompare(b.contract.subscriptionId);
    });
}

export const euRepKeys = {
  all: ['eu-rep'] as const,
  contracts: ['eu-rep', 'contracts'] as const,
  contract: (id: string) => ['eu-rep', 'contracts', id] as const,
};

export function useEuRepContracts() {
  return useQuery({
    queryKey: euRepKeys.contracts,
    queryFn: () => request<EuRepContract[]>('/eu-rep/contracts'),
  });
}

export function useEuRepContract(id: string) {
  return useQuery({
    queryKey: euRepKeys.contract(id),
    queryFn: () => request<EuRepContract>(`/eu-rep/contracts/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateEuRepContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EuRepContractUpdate }) =>
      request<EuRepContract>(`/eu-rep/contracts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: euRepKeys.contracts }),
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
      ]);
    },
  });
}

export function useLinkEuRepDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, documentIds }: { contractId: string; documentIds: string[] }) =>
      request<EuRepContract>(`/eu-rep/contracts/${contractId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ documentIds }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: euRepKeys.contracts }),
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
      ]);
    },
  });
}

export function useUnlinkEuRepDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, documentId }: { contractId: string; documentId: string }) =>
      request<EuRepContract>(`/eu-rep/contracts/${contractId}/documents/${documentId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: euRepKeys.contracts }),
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
      ]);
    },
  });
}
