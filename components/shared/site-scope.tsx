'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  resolveDocumentSite,
  uniqueDocumentsBySite,
  useDocuments,
  type GeneratedDocument,
} from '@/api/documents';

/**
 * A website in the member area — one hosted policy per domain.
 * EU Representation is managed separately via {@link useEuRepScope}.
 */
export type AccountSite = {
  /** Display domain without the `www.` prefix. */
  domain: string;
  document?: GeneratedDocument;
};

type SiteScope = {
  sites: AccountSite[];
  activeSite: AccountSite | null;
  isLoading: boolean;
  selectSite: (domain: string) => void;
};

const SiteScopeContext = createContext<SiteScope | null>(null);

function normalizeDomain(value: string): string {
  return value
    .replace(/^www\./, '')
    .trim()
    .toLowerCase();
}

export function siteHasPolicy(site: AccountSite): boolean {
  return Boolean(site.document);
}

/** Future: per-site cookie banner subscription. */
export function siteHasCookieBanner(_site: AccountSite): boolean {
  return false;
}

/** Future: per-site imprint subscription. */
export function siteHasImprint(_site: AccountSite): boolean {
  return false;
}

export function useAccountSites(): { sites: AccountSite[]; isLoading: boolean } {
  const documents = useDocuments();

  const sites = useMemo(() => {
    return uniqueDocumentsBySite(documents.data ?? [])
      .map((document) => ({
        domain: resolveDocumentSite(document),
        document,
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain, undefined, { sensitivity: 'base' }));
  }, [documents.data]);

  return {
    sites,
    isLoading: documents.isLoading,
  };
}

export function SiteScopeProvider({
  siteParam,
  onSelectSite,
  children,
}: {
  siteParam: string | null;
  onSelectSite: (domain: string) => void;
  children: ReactNode;
}) {
  const { sites, isLoading } = useAccountSites();

  const value = useMemo<SiteScope>(() => {
    const normalized = siteParam ? normalizeDomain(siteParam) : null;
    const matched = normalized ? sites.find((site) => site.domain === normalized) : undefined;
    return {
      sites,
      activeSite: matched ?? sites[0] ?? null,
      isLoading,
      selectSite: onSelectSite,
    };
  }, [sites, siteParam, isLoading, onSelectSite]);

  return <SiteScopeContext.Provider value={value}>{children}</SiteScopeContext.Provider>;
}

export function useOptionalSiteScope(): SiteScope | null {
  return useContext(SiteScopeContext);
}

export function useSiteScope(): SiteScope {
  const value = useOptionalSiteScope();
  if (!value) {
    throw new Error('useSiteScope must be used inside SiteScopeProvider');
  }
  return value;
}
