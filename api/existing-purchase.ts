import { request } from './client';
import { extractDomainHost } from '@/lib/validation/url';

export type ExistingPurchaseCheckResult = {
  exists: boolean;
  displayName?: string;
  href?: string;
};

/** Returns true only when the signed-in account already hosts a policy for the domain. */
export async function checkExistingSitePolicy(
  domainOrUrl: string
): Promise<ExistingPurchaseCheckResult> {
  const domain = extractDomainHost(domainOrUrl);
  if (!domain) {
    return { exists: false };
  }
  const params = new URLSearchParams({ domain });
  return request<ExistingPurchaseCheckResult>(`/check/site-policy?${params.toString()}`);
}

export async function checkExistingEuRep(
  legalEntity: string
): Promise<ExistingPurchaseCheckResult> {
  const params = new URLSearchParams({ legalEntity });
  return request<ExistingPurchaseCheckResult>(`/check/eu-rep?${params.toString()}`);
}
