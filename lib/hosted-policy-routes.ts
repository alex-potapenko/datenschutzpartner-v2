/** Top-level app routes that must not be handled as hosted policy slugs. */
export const RESERVED_HOSTED_POLICY_SLUGS = new Set([
  'about',
  'academy',
  'account',
  'contact',
  'eu-rep',
  'imprint',
  'insights',
  'login',
  'policies',
  'privacy',
  'result',
  'scan',
  'terms',
]);
