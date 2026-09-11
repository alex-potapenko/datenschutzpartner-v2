/**
 * Logo.dev image CDN for third-party service logos.
 *
 * DEV NOTE: The fallback publishable key below is a free-tier key on
 * alex.potapenko@muehlemann-popp.ch. The client must provide their own key
 * for production — set `NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY` in the environment.
 *
 * @see https://www.logo.dev/docs/logo-images/get
 */
const LOGO_DEV_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY ?? 'pk_SVxg-nzqQv6sx6IKaC4yVA';

/** Best-effort display name from a hostname, e.g. `stripe.com` → `Stripe`. */
export function serviceNameFromDomain(domain: string): string {
  const host = domain.replace(/^www\./i, '');
  const parts = host.split('.').filter(Boolean);
  if (parts.length === 0) return '';

  const label = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  if (!label) return '';

  return label
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function policyServiceLogoUrl(domain: string, size = 64): string {
  const params = new URLSearchParams({
    token: LOGO_DEV_PUBLISHABLE_KEY,
    size: String(size),
    format: 'png',
  });

  return `https://img.logo.dev/${encodeURIComponent(domain)}?${params}`;
}
