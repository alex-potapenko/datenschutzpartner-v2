/**
 * Member-area deep links. Kept outside `app/account` so shared chrome (top bar,
 * profile menu) can link into the account without reaching into its internals.
 */

/** Privacy policy section for the active website. */
export const PRIVACY_POLICY_ACCOUNT_HREF = '/account?section=privacyPolicy';

/** EU Representation — global legal-entity scope (`?accountScope=euRep`). */
export const EU_REP_ACCOUNT_HREF = '/account?accountScope=euRep&section=euRep';

/** EU Representation for the active website (`?accountScope=websites`). */
export function siteEuRepAccountHref(site: string) {
  return `/account?accountScope=websites&section=euRep&site=${encodeURIComponent(site)}`;
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
