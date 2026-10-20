import { affiliateReferralUrl } from '@/lib/affiliate-attribution';
import { roundChf, type AffiliateReferralStatus } from '@/lib/affiliate-ledger';
import type { AffiliateApplication, AffiliateProgramSettings } from '@/api/affiliate';

export const AFFILIATE_PROGRAM_SETTINGS: AffiliateProgramSettings = {
  cookieDays: 30,
  defaultCommissionRate: 0.1,
  payoutThresholdChf: 50,
  payoutCadenceMonths: 3,
};

export const AFFILIATE_PAYOUT_CREATED_BY_SEED = 'admin@datenschutzpartner.ch';

export type AffiliatePartnerRecord = {
  id: string;
  applicationId: string;
  email: string;
  slug: string;
  approvedAt: string;
  commissionRate: number;
  notificationEmail: string;
  notifyOnReferral: boolean;
};

export type AffiliateReferralLinkRecord = {
  id: string;
  partnerId: string;
  targetPath: string;
  campaign: string | null;
  createdAt: string;
};

export type AffiliateVisitRecord = {
  id: string;
  partnerId: string;
  /** `null` = the partner's base link without a marketing target. */
  linkId: string | null;
  targetPath: string;
  referrer: string | null;
  campaign: string | null;
  referralId: string | null;
  createdAt: string;
};

export type AffiliateReferralRecord = {
  id: string;
  partnerId: string;
  linkId: string | null;
  reference: string;
  description: string;
  orderAmountChf: number;
  commissionChf: number;
  status: AffiliateReferralStatus;
  createdAt: string;
  payoutId: string | null;
};

export type AffiliatePayoutRecord = {
  id: string;
  partnerId: string;
  amountChf: number;
  periodStart: string | null;
  periodEnd: string | null;
  referralIds: string[];
  createdBy: string;
  createdAt: string;
  invoiceEmailSentTo: string;
};

export function partnerReferralUrl(slug: string) {
  return affiliateReferralUrl(slug);
}

export function referralLinkUrl(slug: string, link: AffiliateReferralLinkRecord) {
  return affiliateReferralUrl(slug, { targetPath: link.targetPath, campaign: link.campaign });
}

export function slugFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'partner';
  const normalized = local
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return normalized.length >= 3 ? normalized : `partner-${normalized || '1'}`;
}

export function createAffiliatePartnerRecord(input: {
  id: string;
  applicationId: string;
  email: string;
  slug: string;
  approvedAt: string;
}): AffiliatePartnerRecord {
  return {
    ...input,
    commissionRate: AFFILIATE_PROGRAM_SETTINGS.defaultCommissionRate,
    notificationEmail: input.email,
    notifyOnReferral: true,
  };
}

const DAY_MS = 86_400_000;

function daysAgo(now: Date, days: number, hour = 10) {
  const date = new Date(now.getTime() - days * DAY_MS);
  date.setUTCHours(hour, (days * 7) % 60, 0, 0);
  return date.toISOString();
}

const PRODUCTS = {
  policy: { description: 'Allgemeine Datenschutzerklärung für 1 Website', amountChf: 89 },
  policyDiscounted: {
    description: 'Allgemeine Datenschutzerklärung für 1 Website',
    amountChf: 80.1,
  },
  policyMulti: { description: 'Datenschutzerklärungen für 3 Websites', amountChf: 120.2 },
  euRep: {
    description: 'Datenschutz-Vertretung in der Europäischen Union (EU) – Budget',
    amountChf: 134.1,
  },
} as const;

type HistoryReferral = {
  key: string;
  daysAgo: number;
  product: keyof typeof PRODUCTS;
  status: AffiliateReferralStatus;
  link: 'base' | 'scan' | 'euRep';
};

/** Unpaid rows fall into the previous calendar quarter so the admin payout flow has data. */
const HISTORY_REFERRALS: HistoryReferral[] = [
  { key: 'r1', daysAgo: 2, product: 'euRep', status: 'pending', link: 'euRep' },
  { key: 'r2', daysAgo: 21, product: 'policyDiscounted', status: 'unpaid', link: 'scan' },
  { key: 'r3', daysAgo: 40, product: 'policy', status: 'unpaid', link: 'base' },
  { key: 'r4', daysAgo: 66, product: 'policyMulti', status: 'unpaid', link: 'scan' },
  { key: 'r5', daysAgo: 160, product: 'euRep', status: 'rejected', link: 'euRep' },
  { key: 'r6', daysAgo: 190, product: 'policyDiscounted', status: 'paid', link: 'scan' },
  { key: 'r7', daysAgo: 232, product: 'policyMulti', status: 'paid', link: 'base' },
  { key: 'r8', daysAgo: 251, product: 'euRep', status: 'paid', link: 'euRep' },
];

const VISIT_REFERRERS = [
  null,
  'https://www.linkedin.com/',
  null,
  'https://www.google.com/',
  'https://blog.example.ch/datenschutz-tipps',
];

export type AffiliateDemoHistory = {
  partner: AffiliatePartnerRecord;
  links: AffiliateReferralLinkRecord[];
  visits: AffiliateVisitRecord[];
  referrals: AffiliateReferralRecord[];
  payouts: AffiliatePayoutRecord[];
};

/**
 * Deterministic partner history for dashboards: two marketing links, ~60 visits, referrals
 * in every lifecycle state, and one completed payout. `variant` thins out the history so
 * seeded partners do not look identical in the admin lists.
 */
export function createAffiliateDemoHistory(
  partner: AffiliatePartnerRecord,
  now: Date,
  variant = 0
): AffiliateDemoHistory {
  const id = (suffix: string) => `${partner.id}-${suffix}`;
  const backdatedPartner: AffiliatePartnerRecord = { ...partner, approvedAt: daysAgo(now, 300) };

  const links: AffiliateReferralLinkRecord[] = [
    {
      id: id('link-scan'),
      partnerId: partner.id,
      targetPath: '/scan',
      campaign: null,
      createdAt: daysAgo(now, 280),
    },
    {
      id: id('link-eu-rep'),
      partnerId: partner.id,
      targetPath: '/eu-rep',
      campaign: 'newsletter',
      createdAt: daysAgo(now, 200),
    },
  ];
  const linkByKey = { base: null, scan: links[0], euRep: links[1] } as const;

  const referrals: AffiliateReferralRecord[] = HISTORY_REFERRALS.filter(
    (_, index) => variant === 0 || index % (variant + 1) !== 0
  ).map((row, index) => {
    const product = PRODUCTS[row.product];
    return {
      id: id(row.key),
      partnerId: partner.id,
      linkId: linkByKey[row.link]?.id ?? null,
      reference: String(2_317_877_199 - index * 104_729 - variant * 7_919),
      description: product.description,
      orderAmountChf: product.amountChf,
      commissionChf: roundChf(product.amountChf * partner.commissionRate),
      status: row.status,
      createdAt: daysAgo(now, row.daysAgo + variant * 3, 15),
      payoutId: null,
    };
  });

  const paid = referrals.filter((row) => row.status === 'paid');
  const payouts: AffiliatePayoutRecord[] = [];
  if (paid.length > 0) {
    const payout: AffiliatePayoutRecord = {
      id: id('payout-1'),
      partnerId: partner.id,
      amountChf: roundChf(paid.reduce((sum, row) => sum + row.commissionChf, 0)),
      periodStart: null,
      periodEnd: daysAgo(now, 101).slice(0, 10),
      referralIds: paid.map((row) => row.id),
      createdBy: AFFILIATE_PAYOUT_CREATED_BY_SEED,
      createdAt: daysAgo(now, 100),
      invoiceEmailSentTo: partner.notificationEmail,
    };
    payouts.push(payout);
    for (const row of paid) row.payoutId = payout.id;
  }

  const visits: AffiliateVisitRecord[] = [];
  const visitCount = 60 - variant * 15;
  for (let index = 0; index < visitCount; index += 1) {
    const link = [null, links[0], links[1]][index % 3] ?? null;
    visits.push({
      id: id(`visit-${String(index)}`),
      partnerId: partner.id,
      linkId: link?.id ?? null,
      targetPath: link?.targetPath ?? '/',
      referrer: VISIT_REFERRERS[index % VISIT_REFERRERS.length] ?? null,
      campaign: link?.campaign ?? null,
      referralId: null,
      createdAt: daysAgo(now, (index * 17) % 290, 8 + (index % 10)),
    });
  }
  for (const referral of referrals) {
    const link = links.find((row) => row.id === referral.linkId) ?? null;
    visits.push({
      id: id(`visit-${referral.id}`),
      partnerId: partner.id,
      linkId: link?.id ?? null,
      targetPath: link?.targetPath ?? '/',
      referrer: null,
      campaign: link?.campaign ?? null,
      referralId: referral.id,
      createdAt: new Date(new Date(referral.createdAt).getTime() - 3_600_000).toISOString(),
    });
  }

  return { partner: backdatedPartner, links, visits, referrals, payouts };
}

const SEED_PARTNERS = [
  { key: 'karin', email: 'karin@lichtweb.ch', slug: 'lichtweb' },
  { key: 'urban', email: 'urban@urban-media.ch', slug: 'urban-media' },
  { key: 'tanja', email: 'tanja@kmu-digital.ch', slug: 'kmu-digital' },
] as const;

export type AffiliateSeed = {
  applications: AffiliateApplication[];
  partners: AffiliatePartnerRecord[];
  links: AffiliateReferralLinkRecord[];
  visits: AffiliateVisitRecord[];
  referrals: AffiliateReferralRecord[];
  payouts: AffiliatePayoutRecord[];
};

/** Other partners so the admin lists and payout flow are populated before anyone applies. */
export function createAffiliateSeed(now: Date): AffiliateSeed {
  const seed: AffiliateSeed = {
    applications: [
      {
        id: 'seed-application-pending',
        email: 'anna.keller@kanzlei-keller.ch',
        websiteUrl: 'https://kanzlei-keller.ch',
        description: 'Wir beraten KMU zu Datenschutz und empfehlen passende Tools.',
        status: 'pending',
        createdAt: daysAgo(now, 1),
        reviewedAt: null,
      },
    ],
    partners: [],
    links: [],
    visits: [],
    referrals: [],
    payouts: [],
  };

  SEED_PARTNERS.forEach((row, index) => {
    const applicationId = `seed-application-${row.key}`;
    const history = createAffiliateDemoHistory(
      createAffiliatePartnerRecord({
        id: `seed-partner-${row.key}`,
        applicationId,
        email: row.email,
        slug: row.slug,
        approvedAt: now.toISOString(),
      }),
      now,
      index
    );
    seed.applications.push({
      id: applicationId,
      email: row.email,
      websiteUrl: `https://${row.email.split('@')[1] ?? 'example.ch'}`,
      description: 'Webagentur mit Fokus auf KMU-Websites in der Schweiz.',
      status: 'approved',
      createdAt: history.partner.approvedAt,
      reviewedAt: history.partner.approvedAt,
    });
    seed.partners.push(history.partner);
    seed.links.push(...history.links);
    seed.visits.push(...history.visits);
    seed.referrals.push(...history.referrals);
    seed.payouts.push(...history.payouts);
  });

  return seed;
}
