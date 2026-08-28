import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { listPolicySubscriptions, resolvePolicySiteCount, type Subscription } from './billing';
import { request } from './client';

/**
 * Documents domain — the generated privacy documents surfaced in the member
 * area. In the prototype this is a curated mock inventory; at handover it maps
 * to the real generator inventory.
 */

/**
 * A single published revision of a hosted policy. Stored internally for audit and
 * admin use — the member area and hosted page always show the current revision only.
 */
export const policyVersionSchema = z.object({
  /** Calendar year this revision covers. */
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
  /** SEO-friendly path segment for the public hosted page (e.g. `datengurke-ch-66c5aa8be2866`). */
  hostedSlug: z.string().optional(),
  /** Public URL of the hosted policy page. */
  siteUrl: z.string().optional(),
  /** Swiss controller / legal entity of this website. Independent of EU Rep. */
  legalEntity: z.string().optional(),
  createdDate: z.string(),
  /** ISO date of the last legal revision applied to the hosted policy. */
  updatedDate: z.string(),
  /** Billing subscription that covers this site (may share a multi-site abo). */
  subscriptionId: z.string().optional(),
  /** Published revisions, newest first. Internal only — not exposed in the UI. */
  versions: z.array(policyVersionSchema).optional(),
  /** EU Rep contract that currently covers this hosted policy. */
  euRepContractId: z.string().optional(),
  /** Hosted policy currently includes the Art. 27 Hamburg representative block. */
  euRepLinked: z.boolean().optional(),
});
export type GeneratedDocument = z.infer<typeof documentSchema>;

/** Strip optional `www.` prefix for display. */
export function formatSiteDomain(site: string): string {
  return site.replace(/^www\./, '');
}

/** Stable opaque suffix for hosted policy slugs (prototype — maps 1:1 to document id). */
function hostedSlugSuffixFromId(id: string): string {
  let hash = 0x811c9dc5;
  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(12, '0').slice(0, 12);
}

/** Build the public path segment for a hosted policy page. */
export function buildHostedPolicySlug(site: string, id: string): string {
  const sitePart = formatSiteDomain(site).replace(/\./g, '-');
  return `${sitePart}-${hostedSlugSuffixFromId(id)}`;
}

/** Resolve the hosted slug for a document, backfilling legacy rows. */
export function resolveHostedPolicySlug(
  document: Pick<GeneratedDocument, 'hostedSlug' | 'site' | 'siteUrl' | 'name' | 'id'>
): string {
  if (document.hostedSlug?.trim()) {
    return document.hostedSlug.trim();
  }
  return buildHostedPolicySlug(resolveDocumentSite(document), document.id);
}

/** Public hosted policy path (leading slash, trailing slash). */
export function buildHostedPolicyPath(
  document: Pick<GeneratedDocument, 'hostedSlug' | 'site' | 'siteUrl' | 'name' | 'id'>
): string {
  return `/${resolveHostedPolicySlug(document)}/`;
}

/**
 * Absolute URL for the hosted policy page. In the prototype this resolves to the
 * current app origin; production maps to `datenschutzerklaerung.ch`.
 */
export function buildHostedPolicyUrl(
  document: Pick<GeneratedDocument, 'hostedSlug' | 'site' | 'siteUrl' | 'name' | 'id'>,
  origin?: string
): string {
  const base =
    origin ??
    (typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_HOSTED_POLICY_ORIGIN ?? 'http://localhost:3000'));
  return `${base.replace(/\/$/, '')}${buildHostedPolicyPath(document)}`;
}

/** Legacy hosted URL pattern kept for backwards compatibility. */
export function buildLegacyHostedPolicyUrl(
  document: Pick<GeneratedDocument, 'site' | 'siteUrl' | 'name' | 'id'>,
  origin = 'https://policies.datenschutzpartner.ch'
): string {
  const site = resolveDocumentSite(document);
  return `${origin.replace(/\/$/, '')}/${document.id}/${site}`;
}

/** Whether a single path segment looks like a hosted policy slug. */
export function isHostedPolicySlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(value);
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
  const withUpdatedDate = withSite.updatedDate
    ? withSite
    : { ...withSite, updatedDate: withSite.createdDate };
  const withSlug = {
    ...withUpdatedDate,
    hostedSlug:
      withUpdatedDate.hostedSlug?.trim() ||
      buildHostedPolicySlug(resolveDocumentSite(withUpdatedDate), withUpdatedDate.id),
  };
  return {
    ...withSlug,
    euRepLinked: Boolean(withSlug.euRepContractId) || withSlug.euRepLinked === true,
  };
}

/** Swiss controller name — stored on the document, else the linked EU Rep contract. */
export function resolveDocumentLegalEntity(
  document: Pick<GeneratedDocument, 'legalEntity' | 'euRepContractId'>,
  contracts: readonly { id: string; legalEntity: string }[]
): string | undefined {
  const own = document.legalEntity?.trim();
  if (own) return own;
  if (!document.euRepContractId) return undefined;
  return contracts.find((row) => row.id === document.euRepContractId)?.legalEntity;
}

function isCookieDocument(document: Pick<GeneratedDocument, 'name' | 'siteUrl'>): boolean {
  return /cookie/i.test(document.name) || /cookie-policy/i.test(document.siteUrl ?? '');
}

/**
 * One website = one hosted privacy policy. Drops leftover cookie rows and
 * duplicate site entries (same domain on the same or another subscription).
 */
export function uniqueDocumentsBySite(documents: GeneratedDocument[]): GeneratedDocument[] {
  const ranked = [...documents].sort((a, b) => {
    const cookieRank = Number(isCookieDocument(a)) - Number(isCookieDocument(b));
    if (cookieRank !== 0) return cookieRank;
    return a.createdDate.localeCompare(b.createdDate);
  });

  const bySite = new Map<string, GeneratedDocument>();
  for (const document of ranked) {
    const site = resolveDocumentSite(document);
    if (!bySite.has(site)) {
      bySite.set(site, document);
    }
  }
  return [...bySite.values()];
}

/** Unique hosted sites already linked to one policy subscription. */
export function countUsedPolicySitesOnSubscription(
  subscriptionId: string,
  documents: readonly GeneratedDocument[]
): number {
  const onSubscription = documents.filter((row) => row.subscriptionId === subscriptionId);
  return uniqueDocumentsBySite(onSubscription).length;
}

/** Unused paid slots on an active policy subscription. */
export function countAvailablePolicySlots(
  subscription: Subscription,
  documents: readonly GeneratedDocument[]
): number {
  if (subscription.productType !== 'policy' || subscription.status !== 'active') {
    return 0;
  }
  const capacity = resolvePolicySiteCount(subscription);
  const used = countUsedPolicySitesOnSubscription(subscription.id, documents);
  return Math.max(0, capacity - used);
}

/** Prefer the subscription with the most free slots (stable tie-break by id). */
export function findPolicySubscriptionWithAvailableSlot(
  subscriptions: Subscription[],
  documents: readonly GeneratedDocument[]
): Subscription | undefined {
  const ranked = listPolicySubscriptions(subscriptions)
    .filter((row) => row.status === 'active')
    .map((row) => ({
      subscription: row,
      available: countAvailablePolicySlots(row, documents),
    }))
    .filter((row) => row.available > 0)
    .sort((a, b) => {
      if (b.available !== a.available) return b.available - a.available;
      return a.subscription.id.localeCompare(b.subscription.id);
    });

  return ranked[0]?.subscription;
}

export function resolveDocumentSubscription(
  document: GeneratedDocument,
  subscriptions: Subscription[]
): Subscription | undefined {
  if (document.subscriptionId) {
    return subscriptions.find((row) => row.id === document.subscriptionId);
  }

  return subscriptions.find((row) => row.productType === 'policy' && row.status === 'active');
}

export type DocumentSubscriptionGroup = {
  subscriptionId: string;
  subscription?: Subscription;
  documents: GeneratedDocument[];
  /** Prepaid capacity not yet linked to a hosted policy. */
  emptySlotCount: number;
};

const SUBSCRIPTION_STATUS_ORDER: Record<string, number> = {
  active: 0,
  processing: 1,
  expired: 2,
  cancelled: 3,
};

/** All policy subscriptions with hosted policies and prepaid empty slots. */
export function groupDocumentsBySubscription(
  documents: GeneratedDocument[],
  subscriptions: Subscription[]
): DocumentSubscriptionGroup[] {
  const grouped = new Map<string, GeneratedDocument[]>();

  for (const document of documents) {
    const key = document.subscriptionId ?? '';
    const list = grouped.get(key);
    if (list) {
      list.push(document);
    } else {
      grouped.set(key, [document]);
    }
  }

  const policySubscriptions = listPolicySubscriptions(subscriptions);

  return policySubscriptions
    .map((subscription) => {
      const docs = grouped.get(subscription.id) ?? [];
      const normalized = uniqueDocumentsBySite(docs).sort((a, b) =>
        a.createdDate.localeCompare(b.createdDate)
      );
      const capacity = resolvePolicySiteCount(subscription);
      return {
        subscriptionId: subscription.id,
        subscription,
        documents: normalized,
        emptySlotCount: Math.max(0, capacity - normalized.length),
      };
    })
    .sort((a, b) => {
      const statusA = SUBSCRIPTION_STATUS_ORDER[a.subscription.status] ?? 9;
      const statusB = SUBSCRIPTION_STATUS_ORDER[b.subscription.status] ?? 9;
      if (statusA !== statusB) return statusA - statusB;
      return a.subscriptionId.localeCompare(b.subscriptionId);
    });
}

/**
 * Generator plan snapshot — active policy subscription count and prepaid slot summary.
 */
export const generatorPlanSchema = z.object({
  activeSubscriptionCount: z.number().int().nonnegative(),
  availableSiteSlots: z.number().int().nonnegative(),
  slotSubscriptionId: z.string().optional(),
});
export type GeneratorPlan = z.infer<typeof generatorPlanSchema>;

export const documentKeys = {
  all: ['documents'] as const,
  detail: (id: string) => ['documents', id] as const,
  hosted: (slug: string) => ['hosted-policies', slug] as const,
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

export function useHostedPolicy(slug: string) {
  return useQuery({
    queryKey: documentKeys.hosted(slug),
    queryFn: () => request<GeneratedDocument>(`/hosted-policies/${slug}`),
    enabled: Boolean(slug),
    retry: false,
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
