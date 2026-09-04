/**
 * Member-area deep links. Kept outside `app/account` so shared chrome (top bar,
 * profile menu) can link into the account without reaching into its internals.
 */

/** Privacy policy section for the active website. */
export const PRIVACY_POLICY_ACCOUNT_HREF = '/account?section=privacyPolicy';

/** Privacy policy for a specific website — optionally opens a service tab. */
export function privacyPolicyAccountHref(options?: { site?: string; tab?: string }) {
  const params = new URLSearchParams();
  params.set('accountScope', 'websites');
  params.set('section', 'privacyPolicy');
  if (options?.site) params.set('site', options.site);
  if (options?.tab) params.set('tab', options.tab);
  return `/account?${params.toString()}`;
}

/** EU Representation — global legal-entity scope (`?accountScope=euRep`). */
export const EU_REP_ACCOUNT_HREF = '/account?accountScope=euRep&section=euRep';

/** EU Rep section for a specific legal entity — optionally opens a service tab. */
export function euRepAccountHref(options?: { contract?: string; tab?: string }) {
  const params = new URLSearchParams();
  params.set('accountScope', 'euRep');
  params.set('section', 'euRep');
  if (options?.contract) params.set('contract', options.contract);
  if (options?.tab) params.set('tab', options.tab);
  return `/account?${params.toString()}`;
}

/** Overview for the active website. */
export const SUBSCRIPTIONS_ACCOUNT_HREF = '/account?section=overview';

/** Cross-website subscription overview (profile menu) — a nested screen outside the shell. */
export const ALL_SUBSCRIPTIONS_ACCOUNT_HREF = '/account/subscriptions';

/** Profile, security and billing details — a nested screen outside the sidebar shell. */
export const ACCOUNT_DETAILS_HREF = '/account/details';

/** Account details, opened on the billing tab. */
export const ACCOUNT_BILLING_DETAILS_HREF = '/account/details?tab=paymentDetails';

/** Complete payment for a policy that is still in its free trial. */
export const ACCOUNT_CHECKOUT_HREF = '/account/checkout';

/** Start the generator wizard on the website-input step (not the /scan landing). */
export const ADD_WEBSITE_WIZARD_HREF = '/result?step=website';

/** Standalone New EU Representation checkout. */
export const ADD_EU_REP_CHECKOUT_HREF = '/account/eu-rep/checkout';

/** Only in-app account paths — used as Quit / Back targets. */
export function safeAccountReturnTo(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/account')) return undefined;
  if (trimmed.startsWith('//') || trimmed.includes('://')) return undefined;
  return trimmed;
}

/** EU Rep checkout may return to the account area or the public `/eu-rep` landing. */
export function safeEuRepCheckoutReturnTo(value: string | null | undefined): string | undefined {
  const account = safeAccountReturnTo(value);
  if (account) return account;
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/eu-rep')) return undefined;
  if (trimmed.startsWith('//') || trimmed.includes('://')) return undefined;
  return trimmed;
}

/** Public EU Rep landing — Quit target when checkout was started from marketing. */
export const EU_REP_LANDING_HREF = '/eu-rep#plans';

export function accountLocationHref(
  pathname: string,
  searchParams: { toString(): string }
): string | undefined {
  const query = searchParams.toString();
  return safeAccountReturnTo(query ? `${pathname}?${query}` : pathname);
}

export function withReturnTo(href: string, returnTo?: string | null): string {
  const safe = safeAccountReturnTo(returnTo);
  if (!safe) return href;
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('returnTo', safe);
  return `${path}?${params.toString()}`;
}

export function addWebsiteWizardHref(returnTo?: string | null) {
  return withReturnTo(ADD_WEBSITE_WIZARD_HREF, returnTo);
}

export function addEuRepCheckoutHref(returnTo?: string | null) {
  return withReturnTo(ADD_EU_REP_CHECKOUT_HREF, returnTo);
}

export function fillPolicySlotWizardHref(subscriptionId: string, returnTo?: string | null) {
  return withReturnTo(
    `${ADD_WEBSITE_WIZARD_HREF}&fillSubscription=${encodeURIComponent(subscriptionId)}`,
    returnTo
  );
}
