export type ScanItemStatus = 'detected' | 'not-detected' | 'warning';
export type ScanItemTier = 'active' | 'privacy' | 'legal';

export type ScanIconKey =
  | 'chat'
  | 'users'
  | 'bell'
  | 'map'
  | 'youtube'
  | 'text'
  | 'instagram'
  | 'megaphone'
  | 'cloud'
  | 'credit'
  | 'storefront'
  | 'envelope'
  | 'user'
  | 'shield'
  | 'cookie'
  | 'robot'
  | 'chart'
  | 'crosshair';

export interface ScanGroupDefinition {
  label: string;
  items: {
    iconKey: ScanIconKey;
    logoDomain?: string;
    name: string;
    description: string;
    status: ScanItemStatus;
    value?: string;
    tier?: ScanItemTier;
  }[];
}

export const SCAN_GROUP_DEFINITIONS: ScanGroupDefinition[] = [
  {
    label: 'Communication and CRM',
    items: [
      {
        iconKey: 'chat',
        logoDomain: 'intercom.com',
        name: 'Intercom',
        description: 'Live chat and customer messaging',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
      {
        iconKey: 'users',
        logoDomain: 'hubspot.com',
        name: 'HubSpot',
        description: 'CRM and marketing automation',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
      {
        iconKey: 'bell',
        logoDomain: 'mailchimp.com',
        name: 'Mailchimp',
        description: 'Email marketing platform',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
    ],
  },
  {
    label: 'Embedded Third-Party Content',
    items: [
      {
        iconKey: 'map',
        logoDomain: 'maps.google.com',
        name: 'Google Maps',
        description: 'Interactive map embeds',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        iconKey: 'youtube',
        logoDomain: 'youtube.com',
        name: 'YouTube',
        description: 'Embedded video content',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        iconKey: 'text',
        logoDomain: 'fonts.google.com',
        name: 'Google Fonts',
        description: 'Third-party web fonts',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        iconKey: 'instagram',
        logoDomain: 'linkedin.com',
        name: 'Social Media Buttons',
        description: 'LinkedIn, Instagram share widgets',
        status: 'detected',
        value: 'LinkedIn, Instagram',
        tier: 'privacy',
      },
      {
        iconKey: 'megaphone',
        logoDomain: 'meta.com',
        name: 'Meta Pixel',
        description: 'Facebook tracking and retargeting',
        status: 'warning',
        value: 'Active',
        tier: 'privacy',
      },
    ],
  },
  {
    label: 'Infrastructure and Hosting',
    items: [
      {
        iconKey: 'cloud',
        logoDomain: 'cloudflare.com',
        name: 'Cloudflare',
        description: 'Hosting and CDN provider',
        status: 'detected',
        value: 'EU-based',
        tier: 'active',
      },
      {
        iconKey: 'credit',
        logoDomain: 'stripe.com',
        name: 'Stripe',
        description: 'Payment processing',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
      {
        iconKey: 'storefront',
        name: 'Online Shop',
        description: 'E-commerce system',
        status: 'not-detected',
        value: 'Not found',
      },
    ],
  },
  {
    label: 'E-Commerce and Forms',
    items: [
      {
        iconKey: 'envelope',
        name: 'Contact Form',
        description: 'Collects visitor data',
        status: 'detected',
        value: 'Detected',
        tier: 'legal',
      },
      {
        iconKey: 'bell',
        name: 'Newsletter Sign-Up',
        description: 'Email subscription form',
        status: 'detected',
        value: 'Detected',
        tier: 'legal',
      },
      {
        iconKey: 'user',
        name: 'User Accounts',
        description: 'Registration and login',
        status: 'detected',
        value: 'Detected',
        tier: 'legal',
      },
    ],
  },
  {
    label: 'Security and Technical Services',
    items: [
      {
        iconKey: 'shield',
        logoDomain: 'cloudflare.com',
        name: 'Cloudflare CDN',
        description: 'Content delivery and DDoS protection',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        iconKey: 'cookie',
        logoDomain: 'cookiebot.com',
        name: 'Cookiebot',
        description: 'Cookie consent management',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        iconKey: 'robot',
        logoDomain: 'google.com',
        name: 'Google reCAPTCHA',
        description: 'Bot protection',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
    ],
  },
  {
    label: 'Analytics and Advertising',
    items: [
      {
        iconKey: 'chart',
        logoDomain: 'google.com',
        name: 'Google Analytics 4',
        description: 'Website analytics and reporting',
        status: 'detected',
        value: 'Active',
        tier: 'privacy',
      },
      {
        iconKey: 'crosshair',
        name: 'Tracking Technologies',
        description: 'Cookies, pixels and fingerprinting scripts',
        status: 'warning',
        value: '12 detected',
        tier: 'privacy',
      },
      {
        iconKey: 'cookie',
        name: 'Cookies in Use',
        description: 'All cookie types combined',
        status: 'warning',
        value: '8 detected',
        tier: 'privacy',
      },
      {
        iconKey: 'megaphone',
        logoDomain: 'google.com',
        name: 'Google Ads',
        description: 'Remarketing and conversion tracking',
        status: 'warning',
        value: 'Active',
        tier: 'privacy',
      },
    ],
  },
  {
    label: 'User Accounts and Authentication',
    items: [
      {
        iconKey: 'user',
        name: 'Login System',
        description: 'Custom user account registration',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
      {
        iconKey: 'shield',
        logoDomain: 'google.com',
        name: 'Google Sign-In',
        description: 'Single Sign-On via Google',
        status: 'detected',
        value: 'SSO Active',
        tier: 'legal',
      },
    ],
  },
];

export const SCAN_ITEM_COUNT = SCAN_GROUP_DEFINITIONS.reduce(
  (acc, group) => acc + group.items.length,
  0
);

export function logoUrl(domain: string) {
  return `https://img.logo.dev/${domain}?token=pk_SVxg-nzqQv6sx6IKaC4yVA`;
}
