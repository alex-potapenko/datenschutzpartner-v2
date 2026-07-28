import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

/**
 * Documents domain — the generated privacy documents surfaced in the member
 * area. In the prototype this is a curated mock inventory; at handover it maps
 * to the real generator inventory.
 */

/**
 * A single published revision of a hosted policy. Because policies are hosted on
 * DSP servers and updated automatically as the law changes, every generated
 * document accumulates one revision per year. The `current` revision is the one
 * live on the customer's site; older revisions stay available for reference.
 */
export const policyVersionSchema = z.object({
  /** Calendar year this revision covers — used as the tab label. */
  year: z.number().int(),
  /** ISO date the revision became effective. */
  effectiveDate: z.string(),
  /** The live revision currently embedded on the site. */
  current: z.boolean(),
  /** i18n key under `policyDocument.changes` describing what changed. */
  changeSummary: z.string().optional(),
});
export type PolicyVersion = z.infer<typeof policyVersionSchema>;

export const documentSchema = z.object({
  id: z.string(),
  /** Policy title without the covered website. */
  name: z.string(),
  /** Website domain this policy covers (e.g. `sutter-web.ch`). */
  site: z.string(),
  /** Public URL of the hosted policy page. */
  siteUrl: z.string().optional(),
  createdDate: z.string(),
  /** ISO date of the last legal revision applied to the hosted policy. */
  updatedDate: z.string(),
  /** Published revisions, newest first. Absent for freshly generated drafts. */
  versions: z.array(policyVersionSchema).optional(),
});
export type GeneratedDocument = z.infer<typeof documentSchema>;

/** Strip optional `www.` prefix for display. */
export function formatSiteDomain(site: string): string {
  return site.replace(/^www\./, '');
}

/**
 * Resolve the covered website — tolerates legacy mock rows persisted before `site`
 * was split out of `name`.
 */
export function resolveDocumentSite(
  document: Pick<GeneratedDocument, 'site' | 'siteUrl' | 'name'>
): string {
  if (document.site) {
    return formatSiteDomain(document.site);
  }

  if (document.siteUrl) {
    const host = document.siteUrl.replace(/^www\./, '').split('/')[0];
    if (host) return host;
  }

  const parts = document.name.split('—');
  const tail = parts[parts.length - 1]?.trim();
  if (tail && tail.includes('.')) {
    return formatSiteDomain(tail);
  }

  return document.name;
}

/** Ensure `site` is present when reading from storage or legacy payloads. */
export function normalizeGeneratedDocument(document: GeneratedDocument): GeneratedDocument {
  const withSite = document.site ? document : { ...document, site: resolveDocumentSite(document) };
  return withSite.updatedDate ? withSite : { ...withSite, updatedDate: withSite.createdDate };
}

/**
 * Generator plan — the Privacy Policy Generator is a yearly subscription that
 * also grants an allowance of websites (`siteAllowance`). Each generated policy
 * is hosted on Datenschutzpartner servers and embedded on the customer's site,
 * so legal updates are applied automatically (no member action, no status to
 * track). Every generated policy consumes one site from the allowance; the
 * member area derives "used" from the generated-document inventory so the
 * counter stays in sync, and the underlying subscription (see the `policy`
 * `Subscription`) carries the term and renewal date. Buying additional sites
 * mid-term upgrade replaces the tier allowance and resets renewal to +12 months from
 * the upgrade payment, with credit for unused time (see `docs/data-layer.md`).
 */
export const generatorPlanSchema = z.object({
  siteAllowance: z.number().int().nonnegative(),
  planId: z.enum(['single', 'team', 'agency']).optional(),
});
export type GeneratorPlan = z.infer<typeof generatorPlanSchema>;

export const documentKeys = {
  all: ['documents'] as const,
  detail: (id: string) => ['documents', id] as const,
  plan: ['generator', 'plan'] as const,
};

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: () => request<GeneratedDocument[]>('/documents'),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => request<GeneratedDocument>(`/documents/${id}`),
    enabled: Boolean(id),
  });
}

export function useGeneratorPlan() {
  return useQuery({
    queryKey: documentKeys.plan,
    queryFn: () => request<GeneratorPlan | null>('/generator/plan'),
  });
}

export function useRegenerateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<GeneratedDocument>(`/documents/${id}/regenerate`, { method: 'POST' }),
    onSuccess: (document) => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      void queryClient.invalidateQueries({ queryKey: documentKeys.detail(document.id) });
    },
  });
}
