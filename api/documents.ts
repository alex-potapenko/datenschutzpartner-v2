import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

/**
 * Documents domain — the generated privacy documents surfaced in the member
 * area. In the prototype this is a curated mock inventory; at handover it maps
 * to the real generator inventory.
 */

export const documentStatusEnum = z.enum(['upToDate', 'updateAvailable']);
export type DocumentStatus = z.infer<typeof documentStatusEnum>;

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Public URL of the generated policy page — shown in dashboard attention items. */
  siteUrl: z.string().optional(),
  createdDate: z.string(),
  /** When a legal update became available — shown when status is updateAvailable. */
  updateAvailableSince: z.string().optional(),
  status: documentStatusEnum,
});
export type GeneratedDocument = z.infer<typeof documentSchema>;

/**
 * Generator plan — the Privacy Policy Generator is not a subscription. A member
 * buys an allowance of websites (`siteAllowance`); every generated policy
 * consumes one site. The member area shows how many sites remain, deriving
 * "used" from the generated-document inventory so the counter stays in sync.
 */
export const generatorPlanSchema = z.object({
  siteAllowance: z.number().int().nonnegative(),
});
export type GeneratorPlan = z.infer<typeof generatorPlanSchema>;

export const documentKeys = {
  all: ['documents'] as const,
  plan: ['generator', 'plan'] as const,
};

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: () => request<GeneratedDocument[]>('/documents'),
  });
}

export function useGeneratorPlan() {
  return useQuery({
    queryKey: documentKeys.plan,
    queryFn: () => request<GeneratorPlan | null>('/generator/plan'),
  });
}
