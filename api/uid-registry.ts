import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

/**
 * Swiss UID registry lookup — autocomplete for company name and address fields
 * in the privacy questionnaire. Prototype uses mocked Zefix-style results.
 */
export const uidCompanySchema = z.object({
  uid: z.string(),
  name: z.string(),
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
});

export type UidCompany = z.infer<typeof uidCompanySchema>;

export const uidRegistryKeys = {
  search: (query: string) => ['uid-registry', 'search', query] as const,
};

export function searchUidCompanies(query: string) {
  const params = new URLSearchParams({ q: query });
  return request<UidCompany[]>(`/uid-registry/search?${params.toString()}`);
}

export function useUidCompanySearch(query: string) {
  const normalized = query.trim();
  return useQuery({
    queryKey: uidRegistryKeys.search(normalized),
    queryFn: () => searchUidCompanies(normalized),
    enabled: normalized.length >= 2,
    staleTime: 60_000,
  });
}
