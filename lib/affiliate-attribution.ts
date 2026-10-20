/** First-party cookie for last-click affiliate attribution (prototype). */
export const AFFILIATE_REF_COOKIE = 'dsp_affiliate_ref';

export const AFFILIATE_REF_COOKIE_MAX_AGE_FALLBACK_DAYS = 30;

/** Public hostname shown in partner dashboards (editable path follows `/ref/`). */
export const AFFILIATE_REF_PUBLIC_HOST = 'datenschutzpartner.com';

export const AFFILIATE_REF_URL_PREFIX = `${AFFILIATE_REF_PUBLIC_HOST}/ref/`;

/** Query parameter on `/ref/:slug` naming the landing page after attribution. */
export const AFFILIATE_TARGET_PARAM = 'to';

export const AFFILIATE_CAMPAIGN_PARAM = 'campaign';

const SITE_HOSTS = new Set([
  'datenschutzpartner.com',
  'www.datenschutzpartner.com',
  'datenschutzpartner.ch',
  'www.datenschutzpartner.ch',
]);

export function affiliateReferralPath(pathSegment: string) {
  return `/ref/${encodeURIComponent(pathSegment)}`;
}

export function affiliateReferralUrl(
  pathSegment: string,
  options: { targetPath?: string | null; campaign?: string | null } = {}
) {
  const params = new URLSearchParams();
  if (options.targetPath && options.targetPath !== '/') {
    params.set(AFFILIATE_TARGET_PARAM, options.targetPath);
  }
  if (options.campaign) {
    params.set(AFFILIATE_CAMPAIGN_PARAM, options.campaign);
  }
  const query = params.toString().replaceAll('%2F', '/');
  return `https://${AFFILIATE_REF_PUBLIC_HOST}${affiliateReferralPath(pathSegment)}${query ? `?${query}` : ''}`;
}

/**
 * Normalizes partner input (`/scan`, `scan`, `datenschutzpartner.ch/scan`, full URL) to a
 * same-site path. Returns `null` for other hosts or anything that is not a page path.
 */
export function normalizeAffiliateTargetPath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return '/';
  if (trimmed.startsWith('/')) return safeTargetPath(trimmed);

  const hasScheme = /^https?:\/\//i.test(trimmed);
  const firstSegment = trimmed.split('/')[0] ?? '';
  if (!hasScheme && !firstSegment.includes('.')) return safeTargetPath(`/${trimmed}`);

  let url: URL;
  try {
    url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (!SITE_HOSTS.has(url.hostname.toLowerCase())) return null;
  return safeTargetPath(`${url.pathname}${url.search}`);
}

/** Only same-origin paths may be used as redirect targets after `/ref/:slug`. */
export function safeTargetPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  if (value.startsWith('/ref/') || value === '/ref') return null;
  return value;
}
