/**
 * Catalog of third-party services a hosted privacy policy can declare.
 *
 * The website scanner recognises the `scannable` entries; everything else can
 * only be declared by the member. Members may also hide a detected service
 * (false positive) or request a service that is missing from this list.
 */

export const POLICY_SERVICE_CATEGORY_IDS = [
  'communication',
  'embedded',
  'infrastructure',
  'forms',
  'security',
  'analytics',
  'accounts',
] as const;

export type PolicyServiceCategoryId = (typeof POLICY_SERVICE_CATEGORY_IDS)[number];

export type PolicyServiceCatalogEntry = {
  id: string;
  name: string;
  categoryId: PolicyServiceCategoryId;
  logoDomain?: string;
  /** Recognised by the website scanner — the rest must be declared manually. */
  scannable: boolean;
};

export const POLICY_SERVICE_CATALOG: readonly PolicyServiceCatalogEntry[] = [
  // Communication and CRM
  {
    id: 'intercom',
    name: 'Intercom',
    categoryId: 'communication',
    logoDomain: 'intercom.com',
    scannable: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    categoryId: 'communication',
    logoDomain: 'hubspot.com',
    scannable: true,
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    categoryId: 'communication',
    logoDomain: 'mailchimp.com',
    scannable: true,
  },
  {
    id: 'brevo',
    name: 'Brevo',
    categoryId: 'communication',
    logoDomain: 'brevo.com',
    scannable: true,
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    categoryId: 'communication',
    logoDomain: 'zendesk.com',
    scannable: true,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    categoryId: 'communication',
    logoDomain: 'salesforce.com',
    scannable: false,
  },

  // Embedded third-party content
  {
    id: 'google-maps',
    name: 'Google Maps',
    categoryId: 'embedded',
    logoDomain: 'maps.google.com',
    scannable: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    categoryId: 'embedded',
    logoDomain: 'youtube.com',
    scannable: true,
  },
  { id: 'vimeo', name: 'Vimeo', categoryId: 'embedded', logoDomain: 'vimeo.com', scannable: true },
  {
    id: 'google-fonts',
    name: 'Google Fonts',
    categoryId: 'embedded',
    logoDomain: 'fonts.google.com',
    scannable: true,
  },
  {
    id: 'social-buttons',
    name: 'Social media buttons',
    categoryId: 'embedded',
    logoDomain: 'linkedin.com',
    scannable: true,
  },
  {
    id: 'calendly',
    name: 'Calendly',
    categoryId: 'embedded',
    logoDomain: 'calendly.com',
    scannable: true,
  },

  // Infrastructure and hosting
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    categoryId: 'infrastructure',
    logoDomain: 'cloudflare.com',
    scannable: true,
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    categoryId: 'infrastructure',
    logoDomain: 'aws.amazon.com',
    scannable: false,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    categoryId: 'infrastructure',
    logoDomain: 'stripe.com',
    scannable: true,
  },
  {
    id: 'datatrans',
    name: 'Datatrans',
    categoryId: 'infrastructure',
    logoDomain: 'datatrans.ch',
    scannable: true,
  },
  {
    id: 'payrexx',
    name: 'Payrexx',
    categoryId: 'infrastructure',
    logoDomain: 'payrexx.com',
    scannable: true,
  },

  // Forms and e-commerce
  { id: 'contact-form', name: 'Contact form', categoryId: 'forms', scannable: true },
  { id: 'newsletter-form', name: 'Newsletter sign-up', categoryId: 'forms', scannable: true },
  { id: 'online-shop', name: 'Online shop', categoryId: 'forms', scannable: true },
  { id: 'job-applications', name: 'Job application form', categoryId: 'forms', scannable: false },

  // Security and technical services
  {
    id: 'recaptcha',
    name: 'Google reCAPTCHA',
    categoryId: 'security',
    logoDomain: 'google.com',
    scannable: true,
  },
  {
    id: 'cookiebot',
    name: 'Cookiebot',
    categoryId: 'security',
    logoDomain: 'cookiebot.com',
    scannable: true,
  },
  {
    id: 'usercentrics',
    name: 'Usercentrics',
    categoryId: 'security',
    logoDomain: 'usercentrics.com',
    scannable: true,
  },
  {
    id: 'sentry',
    name: 'Sentry',
    categoryId: 'security',
    logoDomain: 'sentry.io',
    scannable: true,
  },

  // Analytics and advertising
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    categoryId: 'analytics',
    logoDomain: 'google.com',
    scannable: true,
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    categoryId: 'analytics',
    logoDomain: 'google.com',
    scannable: true,
  },
  {
    id: 'meta-pixel',
    name: 'Meta Pixel',
    categoryId: 'analytics',
    logoDomain: 'meta.com',
    scannable: true,
  },
  {
    id: 'linkedin-insight',
    name: 'LinkedIn Insight Tag',
    categoryId: 'analytics',
    logoDomain: 'linkedin.com',
    scannable: true,
  },
  {
    id: 'matomo',
    name: 'Matomo',
    categoryId: 'analytics',
    logoDomain: 'matomo.org',
    scannable: true,
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    categoryId: 'analytics',
    logoDomain: 'hotjar.com',
    scannable: true,
  },

  // User accounts
  { id: 'login-system', name: 'Login system', categoryId: 'accounts', scannable: true },
  {
    id: 'google-sign-in',
    name: 'Google Sign-In',
    categoryId: 'accounts',
    logoDomain: 'google.com',
    scannable: true,
  },
  {
    id: 'apple-sign-in',
    name: 'Sign in with Apple',
    categoryId: 'accounts',
    logoDomain: 'apple.com',
    scannable: false,
  },
];

const BY_ID = new Map(POLICY_SERVICE_CATALOG.map((entry) => [entry.id, entry]));

export function findPolicyServiceCatalogEntry(id: string): PolicyServiceCatalogEntry | undefined {
  return BY_ID.get(id);
}
