import { DOMAIN_HOST_PATTERN } from './patterns';

export function extractDomainHost(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const host = withoutProtocol.split('/')[0]?.split('?')[0]?.split('#')[0] ?? '';
  return host.replace(/^www\./i, '');
}

export function isValidDomainHost(value: string): boolean {
  const host = extractDomainHost(value);
  if (!host || host.length > 253 || host.includes('..')) return false;
  if (host === 'localhost') return false;
  return DOMAIN_HOST_PATTERN.test(host);
}

/** Normalises a website URL and rejects invalid hostnames. */
export function normalizeAndValidateWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!isValidDomainHost(url.hostname)) return null;
    return withProtocol;
  } catch {
    return null;
  }
}
