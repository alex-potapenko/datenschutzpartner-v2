import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  cityNameField,
  companyNameField,
  countryNameField,
  emailField,
  optionalStreetLine2Field,
  postalCodeField,
  streetAddressField,
} from '@/lib/validation/fields';
import { isActiveSubscription, type Subscription } from './billing';
import { billingKeys } from './billing';
import { documentKeys, type GeneratedDocument } from './documents';
import { request } from './client';

/**
 * EU Representation contracts — coverage for one **Swiss** legal entity.
 * The EU representative itself is always {@link EU_REP_REPRESENTATIVE}
 * (VGS Datenschutzpartner GmbH, Hamburg). Several entities can sit on one
 * plan subscription (`basis` / `plus` / `plus5`). `legalEntity` is the
 * represented Swiss company. `forwardingEmail` and the postal address are
 * operational; the Hamburg block is what appears in linked policies.
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
  /** Billing subscription (plan) that covers this legal entity. */
  subscriptionId: z.string(),
  /** Swiss organisation this contract represents (the controller). */
  legalEntity: companyNameField,
  /** Internal inbox for supervisory and data-subject mail — not shown on the policy. */
  forwardingEmail: emailField,
  /** Postal address of the represented Swiss organisation. */
  postalLine1: streetAddressField,
  postalLine2: optionalStreetLine2Field.optional(),
  postalCode: postalCodeField,
  city: cityNameField,
  country: countryNameField,
  /** Hosted generator documents that currently include the Hamburg block. */
  linkedDocumentIds: z.array(z.string()),
  /** Business website when EU rep is purchased without a hosted policy. */
  website: z.string().optional(),
  status: euRepContractStatusEnum,
});
export type EuRepContract = z.infer<typeof euRepContractSchema>;

export const euRepContractUpdateSchema = euRepContractSchema.pick({
  legalEntity: true,
  forwardingEmail: true,
  postalLine1: true,
  postalLine2: true,
  postalCode: true,
  city: true,
  country: true,
});
export type EuRepContractUpdate = z.infer<typeof euRepContractUpdateSchema>;

export const euRepContractCreateSchema = euRepContractUpdateSchema.extend({
  subscriptionId: z.string().min(1),
});
export type EuRepContractCreate = z.infer<typeof euRepContractCreateSchema>;

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

/** First active contract billed on this subscription (1:N possible). */
export function resolveEuRepContractForSubscription(
  contracts: readonly EuRepContract[],
  subscriptionId: string
): EuRepContract | undefined {
  return contracts.find((row) => row.subscriptionId === subscriptionId && row.status === 'active');
}

export function listEuRepContractsForSubscription(
  contracts: readonly EuRepContract[],
  subscriptionId: string
): EuRepContract[] {
  return contracts
    .filter((row) => row.subscriptionId === subscriptionId && row.status === 'active')
    .slice()
    .sort((a, b) => a.legalEntity.localeCompare(b.legalEntity, undefined, { sensitivity: 'base' }));
}

function normalizeLegalEntityName(value: string): string {
  return value.trim().toLowerCase();
}

/** Entity can be removed only when its plan is not actively billed. */
export function canDeleteEuRepEntity(subscription?: Subscription | null): boolean {
  return !isActiveSubscription(subscription);
}

/** Active contract for the Swiss legal entity named on the questionnaire. */
export function findEuRepContractForLegalEntity(
  contracts: readonly EuRepContract[],
  legalEntity: string,
  subscriptions?: readonly Subscription[]
): EuRepContract | undefined {
  const needle = normalizeLegalEntityName(legalEntity);
  if (!needle) return undefined;
  return contracts.find((row) => {
    if (row.status !== 'active') return false;
    if (normalizeLegalEntityName(row.legalEntity) !== needle) return false;
    if (!subscriptions) return true;
    const subscription = subscriptions.find((item) => item.id === row.subscriptionId);
    return isActiveSubscription(subscription);
  });
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
  _contract: EuRepContract,
  _documents: readonly GeneratedDocument[]
): GeneratedDocument[] {
  return [];
}

/** Flat list of representations with their billing subscription (for sortable tables). */
export function groupEuRepContractsBySubscription(
  contracts: readonly EuRepContract[],
  subscriptions: readonly Subscription[],
  documents: readonly GeneratedDocument[]
): EuRepSubscriptionGroup[] {
  const byId = new Map(subscriptions.map((row) => [row.id, row]));
  return contracts
    .map((contract) => ({
      contract,
      subscription: byId.get(contract.subscriptionId),
      documents: linkedDocumentsForContract(contract, documents),
    }))
    .sort((a, b) => {
      const name = a.contract.legalEntity.localeCompare(b.contract.legalEntity, undefined, {
        sensitivity: 'base',
      });
      if (name !== 0) return name;
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

export function useCreateEuRepContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EuRepContractCreate) =>
      request<EuRepContract>('/eu-rep/contracts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: euRepKeys.contracts }),
        queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions }),
      ]);
    },
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

export function useDeleteEuRepContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`/eu-rep/contracts/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: euRepKeys.all }),
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions }),
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
