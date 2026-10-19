/** First-party cookie for last-click affiliate attribution (prototype). */
export const AFFILIATE_REF_COOKIE = 'dsp_affiliate_ref';

export const AFFILIATE_REF_COOKIE_MAX_AGE_FALLBACK_DAYS = 30;

/** Public hostname shown in partner dashboards (editable path follows `/ref/`). */
export const AFFILIATE_REF_PUBLIC_HOST = 'datenschutzpartner.com';

export const AFFILIATE_REF_URL_PREFIX = `${AFFILIATE_REF_PUBLIC_HOST}/ref/`;

export function affiliateReferralPath(pathSegment: string) {
  return `/ref/${encodeURIComponent(pathSegment)}`;
}

export function affiliateReferralUrl(pathSegment: string) {
  return `https://${AFFILIATE_REF_PUBLIC_HOST}${affiliateReferralPath(pathSegment)}`;
}
