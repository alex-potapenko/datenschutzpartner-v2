import { http, HttpResponse } from 'msw';
import type { Contact, ContactCreate } from '@/api/contacts';
import type { ContactMessage, ContactMessageCreate } from '@/api/contact-messages';
import type { ForgotPasswordInput, LoginInput, Session } from '@/api/auth';
import type { Address, AddressInput, AddressUpdate, AccountSnapshot, Profile } from '@/api/account';
import type { MembershipRow, Order, Subscription, SubscriptionBillingUpdate } from '@/api/billing';
import type { CheckoutSessionCreate, EuRepCheckoutPlanId, GeneratorPlanId } from '@/api/checkout';
import {
  GENERATOR_PLAN_SITE_COUNTS,
  calculateGeneratorUpgradeQuote,
  isGeneratorUpgradeAllowed,
} from '@/api/checkout';
import type { GeneratedDocument, PolicyVersion } from '@/api/documents';
import { normalizeGeneratedDocument } from '@/api/documents';
import type { EuRepInquiry } from '@/api/eu-rep-inquiries';
import type { UidCompany } from '@/api/uid-registry';
import { createCollection } from './db';

function tokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

function isMemberToken(token: string | null): boolean {
  return token === 'mock-member-token';
}

const MOCK_MEMBER_EMAIL = 'lucas.baumgartner@gmail.com';
const MOCK_MEMBER_PASSWORD = 'dspmp';
const MOCK_DEMO_EMAIL = 'demo@datenschutzpartner.ch';
const MOCK_DEMO_PASSWORD = 'demo';

/**
 * Mock API — this is the draft API contract the prototype designs.
 * Keep handlers in sync with the zod schemas in api/. At handover the
 * backend implements this contract and these handlers are deleted.
 *
 * Data is stored via createCollection, so edits survive page reloads in
 * the browser (localStorage) but reset between tests (in-memory in node).
 */
const contacts = createCollection<Contact>('contacts', [
  { id: '1', name: 'Anna Keller', email: 'anna.keller@example.ch', company: 'Helvetia AG' },
  { id: '2', name: 'Luca Bernasconi', email: 'luca.bernasconi@example.ch', company: 'Ticino SA' },
]);

const contactMessages = createCollection<ContactMessage>('contact-messages', []);

const addresses = createCollection<Address>(
  'account-addresses',
  [
    {
      id: '1',
      type: 'billing',
      label: 'Baumgartner Digital AG',
      firstName: 'Lucas',
      lastName: 'Baumgartner',
      company: 'Baumgartner Digital AG',
      line1: 'Bahnhofstrasse 12',
      postalCode: '8001',
      city: 'Zürich',
      country: 'Schweiz',
      vatId: 'CHE-123.456.789 MWST',
    },
    {
      id: '2',
      type: 'billing',
      label: 'Privatadresse',
      firstName: 'Lucas',
      lastName: 'Baumgartner',
      line1: 'Seefeldstrasse 45',
      postalCode: '8008',
      city: 'Zürich',
      country: 'Schweiz',
    },
  ],
  4
);

const profile = createCollection<Profile & { id: string }>(
  'account-profile',
  [
    {
      id: '1',
      firstName: 'Lucas',
      lastName: 'Baumgartner',
      displayName: 'Lucas Baumgartner',
      email: MOCK_MEMBER_EMAIL,
    },
  ],
  2
);

const subscriptions = createCollection<Subscription>(
  'billing-subscriptions',
  [
    {
      id: '1',
      productType: 'academy',
      product: 'Jahresmitgliedschaft',
      planId: 'academy',
      status: 'active',
      startDate: '2026-01-15',
      lastOrderDate: '2026-01-15',
      nextPaymentDate: '2027-01-15',
      billingAddressId: '1',
      totals: {
        product: 'Jahresmitgliedschaft',
        subtotal: 290,
        discount: 0,
        total: 290,
        currency: 'CHF',
      },
      relatedOrderIds: ['1', '17', '18'],
    },
    {
      id: '2',
      productType: 'euRep',
      product: 'EU-Vertretung — Standard',
      planId: 'standard',
      status: 'active',
      startDate: '2026-04-02',
      lastOrderDate: '2026-04-02',
      nextPaymentDate: '2027-04-02',
      billingAddressId: '2',
      totals: {
        product: 'EU-Vertretung Standard (12 Monate)',
        subtotal: 249,
        discount: 0,
        total: 249,
        currency: 'CHF',
      },
      relatedOrderIds: ['3'],
    },
    {
      id: '3',
      productType: 'policy',
      product: 'Privacy Policy Generator — Team',
      planId: 'team',
      status: 'active',
      startDate: '2026-01-15',
      lastOrderDate: '2026-01-15',
      nextPaymentDate: '2027-01-15',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy Generator — 3 Sites (12 Monate)',
        subtotal: 199,
        discount: 0,
        total: 199,
        currency: 'CHF',
      },
      relatedOrderIds: ['2'],
    },
  ],
  5
);

/**
 * Privacy Policy Generator is a yearly subscription that also grants a site
 * allowance. Mock narrative: Lucas subscribed to the Team tier (3 sites) on
 * 2026-01-15 and generated three policies (3 of 3 used). Agency upgrade is
 * available (Option 1 — see docs/data-layer.md).
 */
const generatorPlans = createCollection<{
  id: string;
  siteAllowance: number;
  planId: GeneratorPlanId;
}>('generator-plan', [{ id: '1', siteAllowance: 3, planId: 'team' }], 6);

const euRepInquiries = createCollection<EuRepInquiry>(
  'eu-rep-inquiries',
  [
    {
      id: '1',
      date: '2026-06-18',
      subject: 'Data subject access request — mueller-consulting.ch',
      status: 'forwarded',
      reference: 'DSAR-2026-0412',
    },
    {
      id: '2',
      date: '2026-05-02',
      subject: 'Erasure request from French supervisory authority',
      status: 'answered',
      reference: 'CNIL-8821',
    },
    {
      id: '3',
      date: '2026-03-21',
      subject: 'Cookie consent complaint — kreativ-studio.ch',
      status: 'closed',
    },
    {
      id: '4',
      date: '2026-07-08',
      subject: 'Right to object — marketing newsletter',
      status: 'forwarded',
    },
  ],
  5
);

const EU_REP_CHECKOUT_PRICES: Record<EuRepCheckoutPlanId, number> = {
  budget: 149,
  standard: 249,
  premium: 499,
};

type CheckoutSessionRecord = {
  id: string;
  status: 'pending' | 'completed';
  kind: CheckoutSessionCreate['kind'];
  planId: GeneratorPlanId;
  siteCount: number;
  amount: number;
  listPrice: number;
  creditAmount: number;
  currency: 'CHF';
  domain?: string;
  policyName?: string;
  euRepPlanId?: EuRepCheckoutPlanId;
  orderId?: string;
  documentId?: string;
};

const checkoutSessions = createCollection<CheckoutSessionRecord>('checkout-sessions', [], 1);

function readSiteAllowance(): number {
  return generatorPlans.all()[0]?.siteAllowance ?? 0;
}

function readGeneratorPlanId(): GeneratorPlanId | null {
  return generatorPlans.all()[0]?.planId ?? null;
}

function setGeneratorPlan(planId: GeneratorPlanId, siteAllowance: number) {
  const row = generatorPlans.all()[0];
  if (!row) {
    generatorPlans.create({ siteAllowance, planId });
    return;
  }
  generatorPlans.update(row.id, { siteAllowance, planId });
}

function addOneYear(isoDate: string): string {
  const date = new Date(isoDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function nextOrderNumber(): string {
  const year = new Date().getFullYear();
  const seq = orders.all().length + 1200;
  return `DSP-${year}-${seq}`;
}

function completeCheckoutSession(sessionId: string): CheckoutSessionRecord | undefined {
  const session = checkoutSessions.all().find((row) => row.id === sessionId);
  if (!session || session.status === 'completed') {
    return undefined;
  }

  const today = new Date().toISOString().slice(0, 10);
  const siteAllowance = session.siteCount;
  setGeneratorPlan(session.planId, siteAllowance);
  const nextPaymentDate = addOneYear(today);

  const policyOrder = orders.create({
    productType: 'policy',
    number: nextOrderNumber(),
    date: today,
    status: 'active',
    total: session.amount,
    currency: session.currency,
    siteCount: session.siteCount,
    creditAmount: session.creditAmount > 0 ? session.creditAmount : undefined,
  });

  const policySub = subscriptions.all().find((row) => row.productType === 'policy');
  if (policySub) {
    subscriptions.update(policySub.id, {
      planId: session.planId,
      lastOrderDate: today,
      nextPaymentDate,
      totals: {
        ...policySub.totals,
        product: `Privacy Policy Generator — ${siteAllowance} Sites (12 Monate)`,
        subtotal: policySub.totals.subtotal + session.amount,
        discount: policySub.totals.discount + session.creditAmount,
        total: policySub.totals.total + session.amount,
      },
      relatedOrderIds: [...policySub.relatedOrderIds, policyOrder.id],
    });
  } else {
    subscriptions.create({
      productType: 'policy',
      product: `Privacy Policy Generator — ${session.planId}`,
      planId: session.planId,
      status: 'active',
      startDate: today,
      lastOrderDate: today,
      nextPaymentDate,
      billingAddressId: '1',
      totals: {
        product: `Privacy Policy Generator — ${siteAllowance} Sites (12 Monate)`,
        subtotal: session.amount,
        discount: session.creditAmount,
        total: session.amount,
        currency: 'CHF',
      },
      relatedOrderIds: [policyOrder.id],
    });
  }

  let documentId: string | undefined;
  if (session.domain) {
    const created = documents.create({
      name: session.policyName ?? 'Privacy Policy',
      site: session.domain.replace(/^www\./, ''),
      createdDate: today,
      updatedDate: today,
      versions: buildPolicyVersions(today),
    });
    documentId = created.id;
  }

  if (session.euRepPlanId) {
    const euAmount = EU_REP_CHECKOUT_PRICES[session.euRepPlanId];
    const euOrder = orders.create({
      productType: 'euRep',
      number: nextOrderNumber(),
      date: today,
      status: 'active',
      total: euAmount,
      currency: 'CHF',
      orderKind: 'subscription',
    });

    const euSub = subscriptions.all().find((row) => row.productType === 'euRep');
    if (euSub) {
      subscriptions.update(euSub.id, {
        lastOrderDate: today,
        nextPaymentDate,
        relatedOrderIds: [...euSub.relatedOrderIds, euOrder.id],
      });
    }
  }

  const completed = checkoutSessions.update(sessionId, {
    status: 'completed',
    orderId: policyOrder.id,
    documentId,
  });

  return completed;
}

const memberships = createCollection<MembershipRow>('billing-memberships', [
  {
    id: '1',
    productType: 'academy',
    plan: 'Academy',
    startDate: '2026-01-15',
    expiresDate: '2027-01-15',
    status: 'active',
    nextPaymentDate: '2027-01-15',
  },
  {
    id: '2',
    productType: 'euRep',
    plan: 'EU-Vertretung — Standard',
    startDate: '2026-04-02',
    expiresDate: '2027-04-02',
    status: 'active',
    nextPaymentDate: '2027-04-02',
  },
]);

const orders = createCollection<Order>(
  'billing-orders',
  [
    {
      id: '1',
      productType: 'academy',
      number: 'DSP-2026-1001',
      date: '2026-01-15',
      status: 'active',
      total: 290,
      currency: 'CHF',
      orderKind: 'subscription',
    },
    {
      id: '2',
      productType: 'policy',
      number: 'DSP-2026-1005',
      date: '2026-01-15',
      status: 'active',
      total: 199,
      currency: 'CHF',
      siteCount: 3,
    },
    {
      id: '3',
      productType: 'euRep',
      number: 'DSP-2026-1077',
      date: '2026-04-02',
      status: 'active',
      total: 249,
      currency: 'CHF',
      orderKind: 'subscription',
    },
    {
      id: '17',
      productType: 'academy',
      number: 'DSP-2025-1001',
      date: '2025-01-15',
      status: 'active',
      total: 290,
      currency: 'CHF',
      orderKind: 'subscription',
    },
    {
      id: '18',
      productType: 'academy',
      number: 'DSP-2024-1001',
      date: '2024-01-15',
      status: 'active',
      total: 270,
      currency: 'CHF',
      orderKind: 'subscription',
    },
  ],
  3
);

/** Latest legal year the hosted policies have been maintained through. */
const CURRENT_POLICY_YEAR = 2026;

/**
 * Derive the yearly revision history for a hosted policy. One revision per year
 * from the year it was first generated up to the current maintained year; the
 * newest is the live (`current`) revision.
 */
function buildPolicyVersions(createdDate: string): PolicyVersion[] {
  const createdYear = Number(createdDate.slice(0, 4));
  const versions: PolicyVersion[] = [];
  for (let year = CURRENT_POLICY_YEAR; year >= createdYear; year -= 1) {
    versions.push({
      year,
      current: year === CURRENT_POLICY_YEAR,
      effectiveDate: year === createdYear ? createdDate : `${year}-01-15`,
      changeSummary: year === createdYear ? 'initial' : 'annualReview',
    });
  }
  return versions;
}

const documents = createCollection<GeneratedDocument>(
  'generated-documents',
  (
    [
      {
        id: '1',
        name: 'Datenschutzerklärung',
        site: 'sutter-web.ch',
        createdDate: '2026-01-20',
        updatedDate: '2026-06-15',
      },
      {
        id: '2',
        name: 'Cookie-Richtlinie',
        site: 'sutter-web.ch',
        siteUrl: 'www.sutter-web.ch/cookie-policy',
        createdDate: '2026-01-22',
        updatedDate: '2026-01-22',
      },
      {
        id: '3',
        name: 'Privacy Policy',
        site: 'alpenblick-hotel.ch',
        createdDate: '2026-02-03',
        updatedDate: '2026-05-20',
      },
    ] satisfies GeneratedDocument[]
  ).map((doc) => ({ ...doc, versions: buildPolicyVersions(doc.createdDate) })),
  5
);

const UID_COMPANIES: UidCompany[] = [
  {
    uid: 'CHE-123.456.789',
    name: 'Baumgartner Digital AG',
    street: 'Bahnhofstrasse 12',
    postalCode: '8001',
    city: 'Zürich',
    country: 'Schweiz',
  },
  {
    uid: 'CHE-109.876.543',
    name: 'Sutter Web GmbH',
    street: 'Industriestrasse 4',
    postalCode: '8600',
    city: 'Dübendorf',
    country: 'Schweiz',
  },
  {
    uid: 'CHE-456.789.012',
    name: 'Alpenblick Hotel AG',
    street: 'Dorfstrasse 18',
    postalCode: '3818',
    city: 'Grindelwald',
    country: 'Schweiz',
  },
  {
    uid: 'CHE-321.654.987',
    name: 'Müller Consulting GmbH',
    street: 'Seestrasse 22',
    postalCode: '6004',
    city: 'Luzern',
    country: 'Schweiz',
  },
  {
    uid: 'CHE-987.654.321',
    name: 'Kreativ Studio GmbH',
    street: 'Marktgasse 7',
    postalCode: '3011',
    city: 'Bern',
    country: 'Schweiz',
  },
];

export const handlers = [
  http.get('/api/contacts', () => HttpResponse.json(contacts.all())),

  http.post('/api/contacts', async ({ request }) => {
    const input = (await request.json()) as ContactCreate;
    return HttpResponse.json(contacts.create(input), { status: 201 });
  }),

  http.delete('/api/contacts/:id', ({ params }) => {
    const removed = contacts.remove(String(params.id));
    return new HttpResponse(null, { status: removed ? 204 : 404 });
  }),

  http.post('/api/contact-messages', async ({ request }) => {
    const input = (await request.json()) as ContactMessageCreate;
    return HttpResponse.json(
      contactMessages.create({
        ...input,
        createdAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const input = (await request.json()) as LoginInput;

    if (input.email === MOCK_DEMO_EMAIL && input.password === MOCK_DEMO_PASSWORD) {
      return HttpResponse.json({ token: 'mock-token', email: input.email });
    }

    if (input.email === MOCK_MEMBER_EMAIL && input.password === MOCK_MEMBER_PASSWORD) {
      return HttpResponse.json({ token: 'mock-member-token', email: input.email });
    }

    return HttpResponse.json({ message: 'invalid_credentials' }, { status: 401 });
  }),

  http.get('/api/auth/session', ({ request }) => {
    const auth = request.headers.get('Authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

    if (token === 'mock-member-token') {
      return HttpResponse.json({
        email: MOCK_MEMBER_EMAIL,
        hasAcademyMembership: true,
      } satisfies Session);
    }

    if (token === 'mock-token') {
      return HttpResponse.json({
        email: MOCK_DEMO_EMAIL,
        hasAcademyMembership: false,
      } satisfies Session);
    }

    return HttpResponse.json({
      email: null,
      hasAcademyMembership: false,
    } satisfies Session);
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    const input = (await request.json()) as ForgotPasswordInput;
    if (!input.email) {
      return HttpResponse.json({ message: 'invalid_email' }, { status: 400 });
    }
    return HttpResponse.json({ sent: true as const });
  }),

  http.get('/api/account/snapshot', ({ request }) => {
    const member = isMemberToken(tokenFromRequest(request));
    const activeMembership = memberships
      .all()
      .find((row) => row.status === 'active' && row.productType === 'academy');

    return HttpResponse.json({
      membership:
        member && activeMembership
          ? {
              status: activeMembership.status === 'active' ? 'active' : 'processing',
              subscriptionDate: activeMembership.startDate,
              renewalDate: activeMembership.nextPaymentDate,
            }
          : { status: 'none', subscriptionDate: null, renewalDate: null },
      nextLiveSessionAt: member ? '2026-07-15T10:00:00+02:00' : null,
      documentCount: documents.all().length,
      euRepInquiryAllowance: member
        ? {
            included: 4,
            used: 1,
            furtherInquiryAmount: 79,
            currency: 'CHF',
          }
        : null,
    } satisfies AccountSnapshot);
  }),

  http.get('/api/account/addresses', () => HttpResponse.json(addresses.all())),

  http.post('/api/account/addresses', async ({ request }) => {
    const input = (await request.json()) as AddressInput;
    return HttpResponse.json(addresses.create(input), { status: 201 });
  }),

  http.put('/api/account/addresses/:id', async ({ params, request }) => {
    const input = (await request.json()) as AddressUpdate;
    const updated = addresses.update(String(params.id), input);
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.delete('/api/account/addresses/:id', ({ params }) => {
    const removed = addresses.remove(String(params.id));
    return new HttpResponse(null, { status: removed ? 204 : 404 });
  }),

  http.get('/api/account/profile', ({ request }) => {
    const stored = profile.all()[0];
    const token = tokenFromRequest(request);
    const email = isMemberToken(token) ? MOCK_MEMBER_EMAIL : MOCK_DEMO_EMAIL;
    return HttpResponse.json({
      firstName: stored?.firstName ?? '',
      lastName: stored?.lastName ?? '',
      displayName: stored?.displayName ?? '',
      email: stored?.email ?? email,
    } satisfies Profile);
  }),

  http.put('/api/account/profile', async ({ request }) => {
    const input = (await request.json()) as Profile;
    const existing = profile.all()[0];
    const saved = existing
      ? profile.update(existing.id, input)
      : profile.create({ ...input, id: '1' } as Profile & { id: string });
    return HttpResponse.json(saved);
  }),

  http.put('/api/account/password', async ({ request }) => {
    const body = (await request.json()) as { currentPassword: string };
    if (body.currentPassword !== MOCK_MEMBER_PASSWORD) {
      return HttpResponse.json({ message: 'invalid_password' }, { status: 400 });
    }
    return HttpResponse.json({ changed: true as const });
  }),

  http.get('/api/billing/subscriptions', ({ request }) =>
    HttpResponse.json(isMemberToken(tokenFromRequest(request)) ? subscriptions.all() : [])
  ),

  http.post('/api/billing/subscriptions/:id/cancel', ({ params }) => {
    const updated = subscriptions.update(String(params.id), { status: 'cancelled' });
    const membership = updated
      ? memberships.all().find((row) => row.productType === updated.productType)
      : undefined;
    if (membership) {
      memberships.update(membership.id, { status: 'cancelled' });
    }
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.patch('/api/billing/subscriptions/:id/billing', async ({ params, request }) => {
    const input = (await request.json()) as SubscriptionBillingUpdate;
    const updated = subscriptions.update(String(params.id), input);
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.get('/api/billing/memberships', ({ request }) =>
    HttpResponse.json(isMemberToken(tokenFromRequest(request)) ? memberships.all() : [])
  ),

  http.get('/api/billing/orders', ({ request }) =>
    HttpResponse.json(isMemberToken(tokenFromRequest(request)) ? orders.all() : [])
  ),

  http.get('/api/documents', () =>
    HttpResponse.json(documents.all().map((row) => normalizeGeneratedDocument(row)))
  ),

  http.get('/api/documents/:id', ({ params }) => {
    const id = String(params.id);
    const document = documents.all().find((row) => row.id === id);
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(normalizeGeneratedDocument(document));
  }),

  http.post('/api/documents/:id/regenerate', ({ params }) => {
    const id = String(params.id);
    const existing = documents.all().find((row) => row.id === id);
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const updated = documents.update(id, {
      updatedDate: today,
    });

    return HttpResponse.json(normalizeGeneratedDocument(updated ?? existing));
  }),

  http.get('/api/uid-registry/search', ({ request }) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    if (query.length < 2) {
      return HttpResponse.json([]);
    }

    const results = UID_COMPANIES.filter((company) => {
      const haystack = [company.uid, company.name, company.city, company.street, company.postalCode]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    }).slice(0, 8);

    return HttpResponse.json(results);
  }),

  http.get('/api/generator/plan', ({ request }) => {
    const row = generatorPlans.all()[0];
    return HttpResponse.json(
      isMemberToken(tokenFromRequest(request)) && row
        ? { siteAllowance: row.siteAllowance, planId: row.planId }
        : null
    );
  }),

  http.get('/api/eu-rep/inquiries', ({ request }) =>
    HttpResponse.json(isMemberToken(tokenFromRequest(request)) ? euRepInquiries.all() : [])
  ),

  http.post('/api/checkout/sessions', async ({ request }) => {
    const input = (await request.json()) as CheckoutSessionCreate;
    const siteCount = GENERATOR_PLAN_SITE_COUNTS[input.planId];
    const policySub = subscriptions.all().find((row) => row.productType === 'policy');
    const currentPlanId =
      readGeneratorPlanId() ?? (policySub?.planId as GeneratorPlanId | undefined);
    const usedSiteCount = documents.all().length;

    if (input.kind === 'generatorTopUp') {
      if (!isGeneratorUpgradeAllowed(input.planId, currentPlanId ?? null, usedSiteCount)) {
        return HttpResponse.json({ message: 'upgrade_not_allowed' }, { status: 400 });
      }
    }

    const quote = calculateGeneratorUpgradeQuote({
      targetPlanId: input.planId,
      currentPlanId: input.kind === 'generator' ? null : currentPlanId,
      lastOrderDate: policySub?.lastOrderDate,
      nextPaymentDate: policySub?.nextPaymentDate,
    });

    let amount = quote.amountDue;
    if (input.euRepPlanId) {
      amount += EU_REP_CHECKOUT_PRICES[input.euRepPlanId];
    }

    const session = checkoutSessions.create({
      status: 'pending',
      kind: input.kind,
      planId: input.planId,
      siteCount,
      amount,
      listPrice: quote.listPrice,
      creditAmount: quote.creditAmount,
      currency: 'CHF',
      domain: input.domain,
      policyName: input.policyName,
      euRepPlanId: input.euRepPlanId,
    });

    return HttpResponse.json(
      {
        id: session.id,
        redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
        amount: session.amount,
        currency: session.currency,
        siteCount: session.siteCount,
        listPrice: session.listPrice,
        creditAmount: session.creditAmount,
      },
      { status: 201 }
    );
  }),

  http.post('/api/checkout/sessions/:id/complete', ({ params }) => {
    const completed = completeCheckoutSession(String(params.id));
    if (!completed) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const policySub = subscriptions.all().find((row) => row.productType === 'policy');
    const document = completed.documentId
      ? documents.all().find((row) => row.id === completed.documentId)
      : undefined;

    return HttpResponse.json({
      sessionId: completed.id,
      orderId: completed.orderId,
      document: document ? normalizeGeneratedDocument(document) : undefined,
      siteAllowance: readSiteAllowance(),
      nextPaymentDate: policySub?.nextPaymentDate ?? null,
      creditAmount: completed.creditAmount > 0 ? completed.creditAmount : undefined,
    });
  }),

  http.get('/api/checkout/payrexx-portal', () =>
    HttpResponse.json({
      url: 'https://checkout.payrexx.com/portal/mock-datenschutzpartner',
    })
  ),

  http.get('/api/billing/orders/:id/invoice', ({ params }) => {
    const order = orders.all().find((row) => row.id === String(params.id));
    if (!order) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      url: `/api/billing/orders/${order.id}/invoice.pdf`,
      filename: `${order.number}.pdf`,
    });
  }),

  http.get('/api/billing/orders/:id/invoice.pdf', ({ params }) => {
    const order = orders.all().find((row) => row.id === String(params.id));
    if (!order) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = `Mock invoice ${order.number} — ${order.total} ${order.currency}`;
    return new HttpResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${order.number}.pdf"`,
      },
    });
  }),
];
