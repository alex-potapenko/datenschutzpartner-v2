import { http, HttpResponse } from 'msw';
import type { Contact, ContactCreate } from '@/api/contacts';
import type { ContactMessage, ContactMessageCreate } from '@/api/contact-messages';
import type { ForgotPasswordInput, LoginInput, Session } from '@/api/auth';
import type { Address, AddressInput, AddressUpdate, AccountSnapshot, Profile } from '@/api/account';
import type {
  MembershipRow,
  Order,
  PaymentMethod,
  PaymentMethodCreateInput,
  PaymentMethodFromPayrexxInput,
  PaymentMethodUpdateInput,
  Subscription,
  SubscriptionBillingUpdate,
} from '@/api/billing';
import { detectCardBrand, normalizeCardNumber } from '@/api/billing';
import type { GeneratedDocument } from '@/api/documents';
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
      paymentMethod: 'Visa •••• 4242',
      paymentMethodId: '1',
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
      paymentMethod: 'Mastercard •••• 5555',
      paymentMethodId: '2',
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
  ],
  4
);

/**
 * Privacy Policy Generator is a consumable allowance, not a subscription: the
 * member buys a number of websites and each generated policy uses one. "Used"
 * is derived from the generated-document inventory in the member UI.
 */
const generatorPlan = { siteAllowance: 12 };

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
      number: 'DSP-2026-1042',
      date: '2026-02-03',
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
      id: '7',
      productType: 'policy',
      number: 'DSP-2025-0917',
      date: '2025-11-20',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
    },
    {
      id: '8',
      productType: 'policy',
      number: 'DSP-2026-1015',
      date: '2026-05-20',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
    },
    {
      id: '9',
      productType: 'policy',
      number: 'DSP-2025-1208',
      date: '2025-12-08',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
    },
    {
      id: '10',
      productType: 'policy',
      number: 'DSP-2025-1120',
      date: '2025-12-08',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
    },
    {
      id: '11',
      productType: 'policy',
      number: 'DSP-2025-1022',
      date: '2025-10-22',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
    },
    {
      id: '12',
      productType: 'policy',
      number: 'DSP-2025-0914',
      date: '2025-09-14',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
    },
    {
      id: '13',
      productType: 'policy',
      number: 'DSP-2025-0830',
      date: '2025-08-30',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
    },
    {
      id: '14',
      productType: 'policy',
      number: 'DSP-2025-0831',
      date: '2025-08-30',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
    },
    {
      id: '15',
      productType: 'policy',
      number: 'DSP-2025-0718',
      date: '2025-07-18',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
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
  2
);

const documents = createCollection<GeneratedDocument>(
  'generated-documents',
  [
    {
      id: '1',
      name: 'Datenschutzerklärung — sutter-web.ch',
      createdDate: '2026-02-03',
      status: 'upToDate',
    },
    {
      id: '2',
      name: 'Cookie-Richtlinie — sutter-web.ch',
      siteUrl: 'www.sutter-web.ch/cookie-policy',
      createdDate: '2025-11-20',
      updateAvailableSince: '2026-06-01',
      status: 'updateAvailable',
    },
    {
      id: '3',
      name: 'Privacy Policy — alpenblick-hotel.ch',
      createdDate: '2026-01-15',
      status: 'upToDate',
    },
    {
      id: '4',
      name: 'Datenschutzerklärung — mueller-consulting.ch',
      createdDate: '2025-12-08',
      status: 'upToDate',
    },
    {
      id: '5',
      name: 'Cookie Policy — mueller-consulting.ch',
      siteUrl: 'www.mueller-consulting.ch/cookie-policy',
      createdDate: '2025-12-08',
      updateAvailableSince: '2026-05-15',
      status: 'updateAvailable',
    },
    {
      id: '6',
      name: 'Datenschutzerklärung — kreativ-studio.ch',
      createdDate: '2025-10-22',
      status: 'upToDate',
    },
    {
      id: '7',
      name: 'Privacy Policy — techstart-ag.ch',
      createdDate: '2025-09-14',
      status: 'upToDate',
    },
    {
      id: '8',
      name: 'Datenschutzerklärung — bäckerei-meier.ch',
      siteUrl: 'www.baeckerei-meier.ch/privacy',
      createdDate: '2025-08-30',
      updateAvailableSince: '2026-04-20',
      status: 'updateAvailable',
    },
    {
      id: '9',
      name: 'Cookie-Richtlinie — bäckerei-meier.ch',
      createdDate: '2025-08-30',
      status: 'upToDate',
    },
    {
      id: '10',
      name: 'Datenschutzerklärung — finanzpartner.ch',
      createdDate: '2025-07-18',
      status: 'upToDate',
    },
  ],
  3
);

const paymentMethods = createCollection<PaymentMethod>(
  'billing-payment-methods',
  [
    {
      id: '1',
      type: 'card',
      label: 'Visa •••• 4242',
      cardholderName: 'Lucas Baumgartner',
      brand: 'visa',
      last4: '4242',
      expMonth: 9,
      expYear: 2027,
      provider: 'payrexx',
      externalId: 'payrexx-mock-1',
    },
    {
      id: '2',
      type: 'card',
      label: 'Mastercard •••• 5555',
      cardholderName: 'Lucas Baumgartner',
      brand: 'mastercard',
      last4: '5555',
      expMonth: 3,
      expYear: 2028,
      provider: 'payrexx',
      externalId: 'payrexx-mock-2',
    },
  ],
  4
);

function paymentMethodLabel(method: Pick<PaymentMethod, 'brand' | 'last4'>) {
  if (!method.brand || !method.last4) return 'Card';
  const brand = method.brand.charAt(0).toUpperCase() + method.brand.slice(1);
  return `${brand} •••• ${method.last4}`;
}

function createPaymentMethodFromCardInput(
  input: PaymentMethodCreateInput
): Omit<PaymentMethod, 'id'> {
  const digits = normalizeCardNumber(input.cardNumber);
  const last4 = digits.slice(-4);
  const brand = detectCardBrand(digits) ?? 'visa';

  return {
    type: 'card',
    label: paymentMethodLabel({ brand, last4 }),
    cardholderName: input.cardholderName,
    brand,
    last4,
    expMonth: input.expMonth,
    expYear: input.expYear,
    provider: 'payrexx',
    externalId: `payrexx-mock-${last4}`,
  };
}

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

  http.get('/api/billing/payment-methods', () => HttpResponse.json(paymentMethods.all())),

  http.post('/api/billing/payment-methods', async ({ request }) => {
    const input = (await request.json()) as PaymentMethodCreateInput;
    const created = paymentMethods.create(createPaymentMethodFromCardInput(input));
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post('/api/billing/payment-methods/payrexx-session', () =>
    HttpResponse.json(
      {
        sessionId: `payrexx-session-${crypto.randomUUID()}`,
        checkoutUrl: 'https://www.payrexx.com/en/home/',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      { status: 201 }
    )
  ),

  http.post('/api/billing/payment-methods/from-payrexx', async ({ request }) => {
    const input = (await request.json()) as PaymentMethodFromPayrexxInput;
    const created = paymentMethods.create({
      type: 'card',
      label: 'Visa •••• 4242',
      cardholderName: 'Lucas Baumgartner',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: new Date().getFullYear() + 2,
      provider: 'payrexx',
      externalId: input.payrexxToken,
    });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put('/api/billing/payment-methods/:id', async ({ params, request }) => {
    const input = (await request.json()) as PaymentMethodUpdateInput;
    const updated = paymentMethods.update(String(params.id), {
      cardholderName: input.cardholderName,
      expMonth: input.expMonth,
      expYear: input.expYear,
    });
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.delete('/api/billing/payment-methods/:id', ({ params }) => {
    const removed = paymentMethods.remove(String(params.id));
    return new HttpResponse(null, { status: removed ? 204 : 404 });
  }),

  http.get('/api/documents', () => HttpResponse.json(documents.all())),

  http.get('/api/generator/plan', ({ request }) =>
    HttpResponse.json(isMemberToken(tokenFromRequest(request)) ? generatorPlan : null)
  ),
];
