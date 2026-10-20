/** First-party cookie for last-click affiliate attribution (prototype). */
export const AFFILIATE_REF_COOKIE = 'dsp_affiliate_ref';

export const AFFILIATE_REF_COOKIE_MAX_AGE_FALLBACK_DAYS = 30;

/** Canonical origin for partner-facing referral URLs (legacy .ch marketing paths). */
export const AFFILIATE_REF_PUBLIC_ORIGIN = 'https://www.datenschutzpartner.ch';

/** Public hostname shown in partner dashboards (path continues after origin). */
export const AFFILIATE_REF_PUBLIC_HOST = 'www.datenschutzpartner.ch';

/** @deprecated Prefer full URLs from {@link affiliateReferralUrl}. */
export const AFFILIATE_REF_URL_PREFIX = `${AFFILIATE_REF_PUBLIC_HOST}/ref/`;

/** Query parameter when campaign is not encoded in the path (optional). */
export const AFFILIATE_TARGET_PARAM = 'to';

export const AFFILIATE_CAMPAIGN_PARAM = 'campaign';

const SITE_HOSTS = new Set([
  'datenschutzpartner.com',
  'www.datenschutzpartner.com',
  'datenschutzpartner.ch',
  'www.datenschutzpartner.ch',
]);

/** App routes → public marketing path segments (no leading slash). */
export const AFFILIATE_TARGET_TO_MARKETING_PATH: Record<string, string> = {
  '/scan': 'angebot-datenschutz-generator',
  '/eu-rep': 'angebot-eu-datenschutz-vertretung',
  '/eu-rep/questionnaire': 'fragebogen-eu-datenschutz-vertretung',
};

export function affiliateMarketingSegmentForTarget(targetPath: string): string {
  if (targetPath === '/') return '';
  return (
    AFFILIATE_TARGET_TO_MARKETING_PATH[targetPath] ??
    targetPath.replace(/^\//, '').replace(/\/$/, '')
  );
}

export function affiliateTargetPathFromMarketingSegment(segment: string): string {
  const normalized = segment.replace(/^\/+|\/+$/g, '');
  if (!normalized) return '/';
  for (const [target, marketing] of Object.entries(AFFILIATE_TARGET_TO_MARKETING_PATH)) {
    if (marketing === normalized) return target;
  }
  return `/${normalized}`;
}

/** Strips `/ref/{id}` from a pathname so pasted partner URLs normalize to the app target. */
export function stripEmbeddedAffiliateRefFromPath(pathname: string): string {
  const match = pathname.match(/^(\/.+?)\/ref\/[^/]+\/?$/);
  return match?.[1] ?? pathname;
}

export function affiliateReferralPath(pathSegment: string) {
  return `/ref/${encodeURIComponent(pathSegment)}`;
}

/** Splits a partner-facing referral URL for display (host / marketing page / ref tail). */
export function splitPartnerReferralLinkDisplay(url: string) {
  const path = url.replace(/^https?:\/\//i, '');
  const hostPrefix = `${AFFILIATE_REF_PUBLIC_HOST}/`;
  if (!path.toLowerCase().startsWith(hostPrefix.toLowerCase())) {
    return { hostPrefix: '', marketingPage: null as string | null, refSuffix: path };
  }
  const afterHost = path.slice(hostPrefix.length);
  const refIndex = afterHost.indexOf('ref/');
  if (refIndex === -1) {
    return { hostPrefix, marketingPage: afterHost.replace(/\/$/, '') || null, refSuffix: '' };
  }
  const marketingRaw = afterHost.slice(0, refIndex).replace(/\/$/, '');
  const refTail = afterHost.slice(refIndex);
  const refSuffix = refTail.startsWith('/') ? refTail : `/${refTail}`;
  return {
    hostPrefix,
    marketingPage: marketingRaw || null,
    refSuffix: marketingRaw ? refSuffix : refTail,
  };
}

/** `https://www.datenschutzpartner.ch/{page}/ref/{id}/` or base `/ref/{id}/`. */
export function affiliateReferralUrl(
  pathSegment: string,
  options: { targetPath?: string | null; campaign?: string | null } = {}
) {
  const marketing = affiliateMarketingSegmentForTarget(options.targetPath ?? '/');
  const path = marketing
    ? `/${marketing}/ref/${encodeURIComponent(pathSegment)}/`
    : `${affiliateReferralPath(pathSegment)}/`;
  const params = new URLSearchParams();
  if (options.campaign) {
    params.set(AFFILIATE_CAMPAIGN_PARAM, options.campaign);
  }
  const query = params.toString();
  return `${AFFILIATE_REF_PUBLIC_ORIGIN}${path}${query ? `?${query}` : ''}`;
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
  const stripped = stripEmbeddedAffiliateRefFromPath(`${url.pathname}${url.search}`);
  const path = safeTargetPath(stripped);
  if (!path) return null;
  return affiliateTargetPathFromMarketingSegment(path.replace(/^\//, ''));
}

/** Only same-origin paths may be used as redirect targets after attribution. */
export function safeTargetPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  if (value.includes('/ref/')) return null;
  if (value.startsWith('/ref') && value !== '/ref') return null;
  return value;
}
