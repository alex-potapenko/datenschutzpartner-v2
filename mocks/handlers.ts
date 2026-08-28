import { http, HttpResponse } from 'msw';
import type { Contact, ContactCreate } from '@/api/contacts';
import type { ContactMessage, ContactMessageCreate } from '@/api/contact-messages';
import type { ForgotPasswordInput, LoginInput, Session } from '@/api/auth';
import type { Address, AddressInput, AddressUpdate, AccountSnapshot, Profile } from '@/api/account';
import type { MembershipRow, Order, Subscription, SubscriptionBillingUpdate } from '@/api/billing';
import { countActivePolicySites, countActivePolicySubscriptions } from '@/api/billing';
import type { CheckoutSessionCreate } from '@/api/checkout';
import {
  calculateEuRepQuote,
  calculateGeneratorPolicyQuote,
  qualifyingSiteCountForCheckout,
} from '@/api/checkout';
import type { GeneratedDocument, PolicyVersion } from '@/api/documents';
import {
  buildHostedPolicyPath,
  countAvailablePolicySlots,
  formatSiteDomain,
  normalizeGeneratedDocument,
  resolveDocumentSite,
  resolveHostedPolicySlug,
  uniqueDocumentsBySite,
} from '@/api/documents';
import type { EuRepContract, EuRepContractUpdate, EuRepLinkDocuments } from '@/api/eu-rep';
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

/** Billing-system numbers. Parent subscriptions keep a stable id; each invoice gets its own. */
const ACADEMY_SUBSCRIPTION_ID = '39104';
const EU_REP_BAUMGARTNER_SUBSCRIPTION_ID = '56218';
const EU_REP_ALPENBLICK_SUBSCRIPTION_ID = '57391';
/** Agency prepaid volume (buy-more) — atypical; most members have siteCount 1. */
const POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID = '84729';
const POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID = '86104';
const POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID = '87215';
const POLICY_EXPIRED_SUBSCRIPTION_ID = '90341';
const ACADEMY_INVOICE_2025_ID = '41876';
const ACADEMY_INVOICE_2024_ID = '27591';

function nextTechnicalSubscriptionId(): string {
  const used = new Set(
    [
      ...subscriptions.all().map((row) => row.id),
      ...orders.all().map((row) => row.subscriptionId),
    ].filter((id): id is string => Boolean(id))
  );
  const existing = [...used].map(Number).filter((value) => value >= 10_000 && value <= 99_999);
  let next = existing.length > 0 ? Math.max(...existing) + 17 : 10_000 + (used.size + 1) * 1733;
  if (next > 99_999) next = 10_000;
  while (used.has(String(next)) || next < 10_000) {
    next = next >= 99_999 ? 10_000 : next + 1;
  }
  return String(next);
}

const subscriptions = createCollection<Subscription>(
  'billing-subscriptions',
  [
    {
      id: ACADEMY_SUBSCRIPTION_ID,
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
      id: EU_REP_BAUMGARTNER_SUBSCRIPTION_ID,
      productType: 'euRep',
      product: 'EU-Vertretung — Baumgartner Digital AG',
      planId: '1',
      legalEntityCount: 1,
      status: 'active',
      startDate: '2026-04-02',
      lastOrderDate: '2026-04-02',
      nextPaymentDate: '2027-04-02',
      billingAddressId: '2',
      totals: {
        product: 'EU-Vertretung — Baumgartner Digital AG (12 Monate)',
        subtotal: 249,
        discount: 0,
        total: 249,
        currency: 'CHF',
      },
      relatedOrderIds: ['3'],
    },
    {
      id: EU_REP_ALPENBLICK_SUBSCRIPTION_ID,
      productType: 'euRep',
      product: 'EU-Vertretung — Alpenblick Hospitality AG',
      planId: '1',
      legalEntityCount: 1,
      status: 'active',
      startDate: '2026-05-18',
      lastOrderDate: '2026-05-18',
      nextPaymentDate: '2027-05-18',
      billingAddressId: '2',
      totals: {
        product: 'EU-Vertretung — Alpenblick Hospitality AG (12 Monate)',
        subtotal: 249,
        discount: 0,
        total: 249,
        currency: 'CHF',
      },
      relatedOrderIds: ['21'],
    },
    {
      id: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy Generator — 5 Sites (prepaid)',
      planId: '5',
      siteCount: 5,
      status: 'active',
      startDate: '2026-01-15',
      lastOrderDate: '2026-01-15',
      nextPaymentDate: '2027-01-15',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy Generator — 5 Sites (12 Monate)',
        subtotal: 445,
        discount: 0,
        total: 445,
        currency: 'CHF',
      },
      relatedOrderIds: ['2'],
    },
    {
      id: POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy — alpenblick-hotel.ch',
      planId: '1',
      siteCount: 1,
      status: 'active',
      startDate: '2025-09-16',
      lastOrderDate: '2025-09-16',
      nextPaymentDate: '2026-09-16',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy — alpenblick-hotel.ch (12 Monate)',
        subtotal: 89,
        discount: 0,
        total: 89,
        currency: 'CHF',
      },
      relatedOrderIds: ['20'],
    },
    {
      id: POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy — sutter-web.ch',
      planId: '1',
      siteCount: 1,
      status: 'active',
      startDate: '2026-02-08',
      lastOrderDate: '2026-02-08',
      nextPaymentDate: '2027-02-08',
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy — sutter-web.ch (12 Monate)',
        subtotal: 89,
        discount: 0,
        total: 89,
        currency: 'CHF',
      },
      relatedOrderIds: ['22'],
    },
    {
      id: POLICY_EXPIRED_SUBSCRIPTION_ID,
      productType: 'policy',
      product: 'Privacy Policy Generator — 1 Site',
      planId: '1',
      siteCount: 1,
      status: 'expired',
      startDate: '2025-07-01',
      lastOrderDate: '2025-07-01',
      nextPaymentDate: null,
      billingAddressId: '1',
      totals: {
        product: 'Privacy Policy Generator — 1 Site (12 Monate)',
        subtotal: 89,
        discount: 0,
        total: 89,
        currency: 'CHF',
      },
      relatedOrderIds: ['19'],
    },
  ],
  17
);

type CheckoutSessionRecord = {
  id: string;
  status: 'pending' | 'completed';
  kind: CheckoutSessionCreate['kind'];
  siteCount: number;
  amount: number;
  generatorAmount: number;
  listPrice: number;
  discountRate: number;
  discountAmount: number;
  currency: 'CHF';
  domain?: string;
  policyName?: string;
  legalEntity?: string;
  euRepEntityCount?: number;
  euRepEntities?: { legalEntity: string; forwardingEmail: string }[];
  euRepLinkContractId?: string;
  subscriptionId?: string;
  fillSubscriptionId?: string;
  useAvailableSlot?: boolean;
  orderId?: string;
  documentId?: string;
  euRepContractId?: string;
  euRepContractIds?: string[];
};

const checkoutSessions = createCollection<CheckoutSessionRecord>('checkout-sessions', [], 3);

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

function policyProductLabel(siteCount: number, domain?: string): string {
  if (domain) {
    return `Privacy Policy — ${domain.replace(/^www\./, '')}`;
  }
  return `Privacy Policy Generator — ${siteCount} ${siteCount === 1 ? 'Site' : 'Sites'}`;
}

function euRepProductLabel(legalEntity: string): string {
  return `EU-Vertretung — ${legalEntity}`;
}

function linkDocumentsToContract(contractId: string, documentIds: string[], today: string) {
  const contract = euRepContracts.all().find((row) => row.id === contractId);
  if (!contract) return;

  const linked = new Set(contract.linkedDocumentIds);
  for (const id of documentIds) {
    for (const other of euRepContracts.all()) {
      if (other.id === contractId || !other.linkedDocumentIds.includes(id)) continue;
      euRepContracts.update(other.id, {
        linkedDocumentIds: other.linkedDocumentIds.filter((item) => item !== id),
      });
    }
    linked.add(id);
    documents.update(id, { euRepContractId: contractId, euRepLinked: true, updatedDate: today });
  }

  euRepContracts.update(contractId, { linkedDocumentIds: [...linked] });
}

function unlinkDocumentFromContract(contractId: string, documentId: string, today: string) {
  const contract = euRepContracts.all().find((row) => row.id === contractId);
  if (!contract) return;

  documents.update(documentId, {
    euRepContractId: undefined,
    euRepLinked: false,
    updatedDate: today,
  });
  euRepContracts.update(contractId, {
    linkedDocumentIds: contract.linkedDocumentIds.filter((id) => id !== documentId),
  });
}

function createEuRepPurchase(
  session: CheckoutSessionRecord,
  today: string,
  extraLinkedDocumentIds: string[] = []
):
  | { orderId: string; subscriptionId: string; contractId?: string; contractIds: string[] }
  | undefined {
  const entityCount = Math.max(1, session.euRepEntityCount ?? session.euRepEntities?.length ?? 0);
  if (!session.euRepEntityCount && !session.euRepEntities?.length) return undefined;

  const unitQuote = calculateEuRepQuote(1);
  const nextPaymentDate = addOneYear(today);
  const entities = session.euRepEntities ?? [];
  const contractIds: string[] = [];
  let firstOrderId: string | undefined;
  let firstSubscriptionId: string | undefined;
  let firstContractId: string | undefined;

  for (let index = 0; index < entityCount; index += 1) {
    const details = entities[index];
    const legalEntity = details?.legalEntity.trim() || `Legal entity ${String(index + 1)}`;
    const product = euRepProductLabel(legalEntity);
    const subscriptionId = nextTechnicalSubscriptionId();

    const euOrder = orders.create({
      productType: 'euRep',
      number: nextOrderNumber(),
      date: today,
      status: 'active',
      total: unitQuote.amountDue,
      currency: 'CHF',
      legalEntityCount: 1,
      orderKind: 'subscription',
      subscriptionId,
    });

    subscriptions.create({
      id: subscriptionId,
      productType: 'euRep',
      product,
      planId: '1',
      legalEntityCount: 1,
      status: 'active',
      startDate: today,
      lastOrderDate: today,
      nextPaymentDate,
      billingAddressId: '1',
      totals: {
        product: `${product} (12 Monate)`,
        subtotal: unitQuote.amountDue,
        discount: 0,
        total: unitQuote.amountDue,
        currency: 'CHF',
      },
      relatedOrderIds: [euOrder.id],
    });

    const created = euRepContracts.create({
      subscriptionId,
      legalEntity,
      forwardingEmail: details?.forwardingEmail.trim() || MOCK_MEMBER_EMAIL,
      linkedDocumentIds: [],
      status: 'active',
    });

    contractIds.push(created.id);
    firstOrderId ??= euOrder.id;
    firstSubscriptionId ??= subscriptionId;
    firstContractId ??= created.id;
  }

  if (firstContractId && extraLinkedDocumentIds.length > 0) {
    linkDocumentsToContract(firstContractId, extraLinkedDocumentIds, today);
  }

  return {
    orderId: firstOrderId ?? '',
    subscriptionId: firstSubscriptionId ?? '',
    contractId: firstContractId,
    contractIds,
  };
}

function stripEuRepFromHostedPolicies(subscriptionId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const contracts = euRepContracts
    .all()
    .filter((row) => row.subscriptionId === subscriptionId && row.status === 'active');

  for (const contract of contracts) {
    for (const id of contract.linkedDocumentIds) {
      documents.update(id, { euRepContractId: undefined, euRepLinked: false, updatedDate: today });
    }
    euRepContracts.update(contract.id, { status: 'cancelled', linkedDocumentIds: [] });
  }
}

function completeCheckoutSession(sessionId: string): CheckoutSessionRecord | undefined {
  const session = checkoutSessions.all().find((row) => row.id === sessionId);
  if (!session || session.status === 'completed') {
    return undefined;
  }

  const today = new Date().toISOString().slice(0, 10);

  if (session.kind === 'euRep') {
    const euResult = createEuRepPurchase(session, today);
    if (!euResult) return undefined;
    return checkoutSessions.update(sessionId, {
      status: 'completed',
      orderId: euResult.orderId,
      subscriptionId: euResult.subscriptionId,
      euRepContractId: euResult.contractId,
      euRepContractIds: euResult.contractIds,
    });
  }

  const nextPaymentDate = addOneYear(today);
  const isRenewal = session.kind === 'generatorRenewal';
  const siteCount = Math.max(1, session.siteCount);

  if (session.fillSubscriptionId && session.domain) {
    const slotSubscription = subscriptions
      .all()
      .find((row) => row.id === session.fillSubscriptionId);
    if (
      !slotSubscription ||
      slotSubscription.productType !== 'policy' ||
      slotSubscription.status !== 'active' ||
      countAvailablePolicySlots(slotSubscription, documents.all()) <= 0
    ) {
      return undefined;
    }

    const willBuyEuRep = Boolean(session.euRepEntityCount || session.euRepEntities?.length);
    const willLinkExisting = Boolean(session.euRepLinkContractId);
    const linkedContract = willLinkExisting
      ? euRepContracts.all().find((row) => row.id === session.euRepLinkContractId)
      : undefined;
    const swissLegalEntity =
      session.legalEntity?.trim() ||
      session.euRepEntities?.[0]?.legalEntity.trim() ||
      linkedContract?.legalEntity ||
      undefined;

    const created = documents.create({
      name: session.policyName ?? 'Privacy Policy',
      site: session.domain.replace(/^www\./, ''),
      legalEntity: swissLegalEntity,
      subscriptionId: slotSubscription.id,
      createdDate: today,
      updatedDate: today,
      versions: buildPolicyVersions(today),
      euRepLinked: willBuyEuRep || willLinkExisting,
    });

    let euRepOrderId = '';
    if (willBuyEuRep) {
      const euResult = createEuRepPurchase(session, today, [created.id]);
      euRepOrderId = euResult?.orderId ?? '';
    } else if (willLinkExisting && session.euRepLinkContractId) {
      linkDocumentsToContract(session.euRepLinkContractId, [created.id], today);
    }

    return checkoutSessions.update(sessionId, {
      status: 'completed',
      orderId: euRepOrderId,
      documentId: created.id,
      subscriptionId: slotSubscription.id,
    });
  }

  const productLabel = session.domain
    ? policyProductLabel(1, session.domain)
    : policyProductLabel(siteCount);

  let policySubscriptionId = isRenewal ? session.subscriptionId : undefined;
  if (isRenewal && policySubscriptionId) {
    const existing = subscriptions.all().find((row) => row.id === policySubscriptionId);
    if (!existing || existing.productType !== 'policy') {
      policySubscriptionId = undefined;
    }
  }

  const subscriptionSiteCount =
    session.domain && !session.fillSubscriptionId && !isRenewal ? 1 : siteCount;

  if (!policySubscriptionId) {
    const createdSub = subscriptions.create({
      id: nextTechnicalSubscriptionId(),
      productType: 'policy',
      product: session.domain ? productLabel : policyProductLabel(subscriptionSiteCount),
      planId: String(subscriptionSiteCount),
      siteCount: subscriptionSiteCount,
      status: 'active',
      startDate: today,
      lastOrderDate: today,
      nextPaymentDate,
      billingAddressId: '1',
      totals: {
        product: `${productLabel} (12 Monate)`,
        subtotal: session.listPrice,
        discount: session.discountAmount,
        total: session.generatorAmount,
        currency: 'CHF',
      },
      relatedOrderIds: [],
    });
    policySubscriptionId = createdSub.id;
  }

  const policyOrder = orders.create({
    productType: 'policy',
    number: nextOrderNumber(),
    date: today,
    status: 'active',
    total: session.generatorAmount,
    currency: session.currency,
    siteCount: subscriptionSiteCount,
    discountAmount: session.discountAmount > 0 ? session.discountAmount : undefined,
    discountRate: session.discountRate > 0 ? session.discountRate : undefined,
    subscriptionId: policySubscriptionId,
    orderKind: isRenewal ? 'renewal' : 'subscription',
  });

  const policySub = subscriptions.all().find((row) => row.id === policySubscriptionId);
  if (policySub) {
    subscriptions.update(policySub.id, {
      lastOrderDate: today,
      nextPaymentDate,
      status: 'active',
      siteCount: isRenewal ? (policySub.siteCount ?? subscriptionSiteCount) : subscriptionSiteCount,
      planId: String(
        isRenewal ? (policySub.siteCount ?? subscriptionSiteCount) : subscriptionSiteCount
      ),
      product: session.domain ? productLabel : policyProductLabel(subscriptionSiteCount),
      totals: {
        ...policySub.totals,
        product: `${session.domain ? productLabel : policySub.product} (12 Monate)`,
        subtotal: session.listPrice,
        discount: session.discountAmount,
        total: session.generatorAmount,
      },
      relatedOrderIds: [...policySub.relatedOrderIds, policyOrder.id],
    });
  }

  const willBuyEuRep = Boolean(session.euRepEntityCount || session.euRepEntities?.length);
  const willLinkExisting = Boolean(session.euRepLinkContractId);
  const linkedContract = willLinkExisting
    ? euRepContracts.all().find((row) => row.id === session.euRepLinkContractId)
    : undefined;
  const swissLegalEntity =
    session.legalEntity?.trim() ||
    session.euRepEntities?.[0]?.legalEntity.trim() ||
    linkedContract?.legalEntity ||
    undefined;

  let documentId: string | undefined;
  if (session.domain) {
    const created = documents.create({
      name: session.policyName ?? 'Privacy Policy',
      site: session.domain.replace(/^www\./, ''),
      legalEntity: swissLegalEntity,
      subscriptionId: policySubscriptionId,
      createdDate: today,
      updatedDate: today,
      versions: buildPolicyVersions(today),
      euRepLinked: willBuyEuRep || willLinkExisting,
    });
    documentId = created.id;
  }

  if (willBuyEuRep) {
    createEuRepPurchase(session, today, documentId ? [documentId] : []);
  } else if (willLinkExisting && session.euRepLinkContractId && documentId) {
    linkDocumentsToContract(session.euRepLinkContractId, [documentId], today);
  }

  const completed = checkoutSessions.update(sessionId, {
    status: 'completed',
    orderId: policyOrder.id,
    documentId,
    subscriptionId: policySubscriptionId,
  });

  return completed;
}

const memberships = createCollection<MembershipRow>(
  'billing-memberships',
  [
    {
      id: '1',
      productType: 'academy',
      plan: 'Academy',
      startDate: '2026-01-15',
      expiresDate: '2027-01-15',
      status: 'active',
      nextPaymentDate: '2027-01-15',
    },
  ],
  2
);

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
      subscriptionId: ACADEMY_SUBSCRIPTION_ID,
    },
    {
      id: '2',
      productType: 'policy',
      number: 'DSP-2026-1005',
      date: '2026-01-15',
      status: 'active',
      total: 445,
      currency: 'CHF',
      siteCount: 5,
      orderKind: 'subscription',
      subscriptionId: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
    },
    {
      id: '20',
      productType: 'policy',
      number: 'DSP-2025-1024',
      date: '2025-09-16',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
      orderKind: 'subscription',
      subscriptionId: POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID,
    },
    {
      id: '22',
      productType: 'policy',
      number: 'DSP-2026-1031',
      date: '2026-02-08',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
      orderKind: 'subscription',
      subscriptionId: POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID,
    },
    {
      id: '3',
      productType: 'euRep',
      number: 'DSP-2026-1077',
      date: '2026-04-02',
      status: 'active',
      total: 249,
      currency: 'CHF',
      legalEntityCount: 1,
      orderKind: 'subscription',
      subscriptionId: EU_REP_BAUMGARTNER_SUBSCRIPTION_ID,
    },
    {
      id: '21',
      productType: 'euRep',
      number: 'DSP-2026-1082',
      date: '2026-05-18',
      status: 'active',
      total: 249,
      currency: 'CHF',
      legalEntityCount: 1,
      orderKind: 'subscription',
      subscriptionId: EU_REP_ALPENBLICK_SUBSCRIPTION_ID,
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
      subscriptionId: ACADEMY_INVOICE_2025_ID,
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
      subscriptionId: ACADEMY_INVOICE_2024_ID,
    },
    {
      id: '19',
      productType: 'policy',
      number: 'DSP-2025-1102',
      date: '2025-07-01',
      status: 'active',
      total: 89,
      currency: 'CHF',
      siteCount: 1,
      orderKind: 'subscription',
      subscriptionId: POLICY_EXPIRED_SUBSCRIPTION_ID,
    },
  ],
  15
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
        legalEntity: 'Baumgartner Digital AG',
        subscriptionId: POLICY_SINGLE_SUTTER_SUBSCRIPTION_ID,
        createdDate: '2026-02-10',
        updatedDate: '2026-06-15',
        euRepContractId: '1',
        euRepLinked: true,
      },
      {
        id: '3',
        name: 'Privacy Policy',
        site: 'alpenblick-hotel.ch',
        legalEntity: 'Alpenblick Hospitality AG',
        subscriptionId: POLICY_SINGLE_ALPENBLICK_SUBSCRIPTION_ID,
        createdDate: '2025-09-20',
        updatedDate: '2026-05-20',
        euRepContractId: '2',
        euRepLinked: true,
      },
      {
        id: '6',
        name: 'Privacy Policy',
        site: 'mueller-consulting.ch',
        legalEntity: 'Müller Consulting GmbH',
        subscriptionId: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
        createdDate: '2026-01-22',
        updatedDate: '2026-04-02',
        euRepContractId: '1',
        euRepLinked: true,
      },
      {
        id: '7',
        name: 'Datenschutzerklärung',
        site: 'seeblick-apotheke.ch',
        legalEntity: 'Seeblick Apotheke AG',
        subscriptionId: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
        createdDate: '2026-02-05',
        updatedDate: '2026-02-05',
      },
      {
        id: '8',
        name: 'Privacy Policy',
        site: 'atelier-bern.ch',
        legalEntity: 'Atelier Bern GmbH',
        subscriptionId: POLICY_AGENCY_PREPAID_SUBSCRIPTION_ID,
        createdDate: '2026-03-02',
        updatedDate: '2026-03-02',
      },
      {
        id: '4',
        name: 'Privacy Policy',
        site: 'kreativ-studio.ch',
        legalEntity: 'Kreativ Studio GmbH',
        subscriptionId: POLICY_EXPIRED_SUBSCRIPTION_ID,
        createdDate: '2025-07-08',
        updatedDate: '2026-06-01',
      },
    ] satisfies GeneratedDocument[]
  ).map((doc) => ({ ...doc, versions: buildPolicyVersions(doc.createdDate) })),
  20
);

const euRepContracts = createCollection<EuRepContract>(
  'eu-rep-contracts',
  [
    {
      id: '1',
      subscriptionId: EU_REP_BAUMGARTNER_SUBSCRIPTION_ID,
      legalEntity: 'Baumgartner Digital AG',
      forwardingEmail: MOCK_MEMBER_EMAIL,
      linkedDocumentIds: ['1', '6'],
      status: 'active',
    },
    {
      id: '2',
      subscriptionId: EU_REP_ALPENBLICK_SUBSCRIPTION_ID,
      legalEntity: 'Alpenblick Hospitality AG',
      forwardingEmail: 'privacy@alpenblick-hotel.ch',
      linkedDocumentIds: ['3'],
      status: 'active',
    },
  ],
  5
);

const SWISS_LEGAL_ENTITY_BY_SITE: Record<string, string> = {
  'sutter-web.ch': 'Baumgartner Digital AG',
  'alpenblick-hotel.ch': 'Alpenblick Hospitality AG',
  'mueller-consulting.ch': 'Baumgartner Digital AG',
  'seeblick-apotheke.ch': 'Baumgartner Digital AG',
  'atelier-bern.ch': 'Atelier Bern GmbH',
  'm-p.ch': 'Alpenblick Hospitality AG',
  'berghotel-grindelwald.ch': 'Berghotel Grindelwald AG',
  'praxis-luzern.ch': 'Praxis Luzern AG',
  'kreativ-studio.ch': 'Kreativ Studio GmbH',
};

function presentDocument(document: GeneratedDocument): GeneratedDocument {
  const normalized = normalizeGeneratedDocument(document);
  if (normalized.legalEntity?.trim()) return normalized;

  const fromContract = euRepContracts
    .all()
    .find((row) => row.id === normalized.euRepContractId)?.legalEntity;
  const legalEntity = SWISS_LEGAL_ENTITY_BY_SITE[resolveDocumentSite(normalized)] ?? fromContract;
  if (!legalEntity) return normalized;

  documents.update(normalized.id, { legalEntity });
  return { ...normalized, legalEntity };
}

function listHostedPolicies(): GeneratedDocument[] {
  const all = documents.all();
  const keep = uniqueDocumentsBySite(all);
  const keepIds = new Set(keep.map((row) => row.id));
  for (const row of all) {
    if (!keepIds.has(row.id)) {
      documents.remove(row.id);
    }
  }
  return keep.map((row) => presentDocument(row));
}

function findHostedPolicyBySlug(slug: string): GeneratedDocument | undefined {
  return listHostedPolicies().find((row) => resolveHostedPolicySlug(row) === slug);
}

function findHostedPolicyByLegacy(id: string, site: string): GeneratedDocument | undefined {
  const normalizedSite = formatSiteDomain(site);
  return listHostedPolicies().find(
    (row) => row.id === id && resolveDocumentSite(row) === normalizedSite
  );
}

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
      : profile.create({ ...input, id: '1' });
    return HttpResponse.json(saved);
  }),

  http.put('/api/account/password', async ({ request }) => {
    const body = (await request.json()) as { currentPassword: string };
    if (body.currentPassword !== MOCK_MEMBER_PASSWORD) {
      return HttpResponse.json({ message: 'invalid_password' }, { status: 400 });
    }
    return HttpResponse.json({ changed: true as const });
  }),

  http.get('/api/billing/subscriptions/:id', ({ request, params }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const subscription = subscriptions.all().find((row) => row.id === String(params.id));
    if (!subscription) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(subscription);
  }),

  http.get('/api/billing/subscriptions', ({ request }) =>
    HttpResponse.json(isMemberToken(tokenFromRequest(request)) ? subscriptions.all() : [])
  ),

  http.post('/api/billing/subscriptions/:id/cancel', ({ params }) => {
    const updated = subscriptions.update(String(params.id), { status: 'cancelled' });
    if (updated?.productType === 'academy') {
      const membership = memberships.all().find((row) => row.productType === 'academy');
      if (membership) {
        memberships.update(membership.id, { status: 'cancelled' });
      }
    }
    if (updated?.productType === 'euRep') {
      stripEuRepFromHostedPolicies(updated.id);
    }
    if (!updated) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.post('/api/billing/subscriptions/:id/continue', ({ params }) => {
    const updated = subscriptions.update(String(params.id), { status: 'active' });
    if (updated?.productType === 'academy') {
      const membership = memberships.all().find((row) => row.productType === 'academy');
      if (membership) {
        memberships.update(membership.id, { status: 'active' });
      }
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

  http.get('/api/documents', () => HttpResponse.json(listHostedPolicies())),

  http.get('/api/documents/:id', ({ params }) => {
    const id = String(params.id);
    const document = documents.all().find((row) => row.id === id);
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(presentDocument(document));
  }),

  http.get('/api/hosted-policies/legacy/:id/:site', ({ params }) => {
    const document = findHostedPolicyByLegacy(String(params.id), String(params.site));
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      document,
      slug: resolveHostedPolicySlug(document),
      path: buildHostedPolicyPath(document),
    });
  }),

  http.get('/api/hosted-policies/:slug', ({ params }) => {
    const slug = String(params.slug);
    const document = findHostedPolicyBySlug(slug);
    if (!document) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(document);
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

    return HttpResponse.json(presentDocument(updated ?? existing));
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
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json(null);
    }
    const allSubscriptions = subscriptions.all();
    const allDocuments = documents.all();
    const policyRows = allSubscriptions.filter(
      (row) => row.productType === 'policy' && row.status === 'active'
    );
    let availableSiteSlots = 0;
    let slotSubscriptionId: string | undefined;
    for (const row of policyRows) {
      const available = countAvailablePolicySlots(row, allDocuments);
      availableSiteSlots += available;
      if (!slotSubscriptionId && available > 0) {
        slotSubscriptionId = row.id;
      }
    }

    return HttpResponse.json({
      activeSubscriptionCount: countActivePolicySubscriptions(allSubscriptions),
      availableSiteSlots,
      slotSubscriptionId,
    });
  }),

  http.get('/api/eu-rep/contracts', ({ request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json([]);
    }
    return HttpResponse.json(euRepContracts.all());
  }),

  http.get('/api/eu-rep/contracts/:id', ({ request, params }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const contract = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!contract) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(contract);
  }),

  http.patch('/api/eu-rep/contracts/:id', async ({ params, request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const existing = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const input = (await request.json()) as EuRepContractUpdate;
    const legalEntityChanged = input.legalEntity !== existing.legalEntity;
    const updated = euRepContracts.update(existing.id, {
      legalEntity: input.legalEntity,
      forwardingEmail: input.forwardingEmail,
    });
    if (legalEntityChanged) {
      for (const id of existing.linkedDocumentIds) {
        documents.update(id, { legalEntity: input.legalEntity });
      }
    }
    return HttpResponse.json(updated ?? existing);
  }),

  http.post('/api/eu-rep/contracts/:id/documents', async ({ params, request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const contract = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!contract || contract.status !== 'active') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const input = (await request.json()) as EuRepLinkDocuments;
    const today = new Date().toISOString().slice(0, 10);
    linkDocumentsToContract(contract.id, input.documentIds, today);
    return HttpResponse.json(
      euRepContracts.all().find((row) => row.id === contract.id) ?? contract
    );
  }),

  http.delete('/api/eu-rep/contracts/:id/documents/:documentId', ({ params, request }) => {
    if (!isMemberToken(tokenFromRequest(request))) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const contract = euRepContracts.all().find((row) => row.id === String(params.id));
    if (!contract || contract.status !== 'active') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const documentId = String(params.documentId);
    if (!contract.linkedDocumentIds.includes(documentId)) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const today = new Date().toISOString().slice(0, 10);
    unlinkDocumentFromContract(contract.id, documentId, today);
    return HttpResponse.json(
      euRepContracts.all().find((row) => row.id === contract.id) ?? contract
    );
  }),

  http.post('/api/checkout/sessions', async ({ request }) => {
    const input = (await request.json()) as CheckoutSessionCreate;

    if (input.kind === 'euRep') {
      const entityCount = Math.max(1, input.euRepEntityCount ?? input.euRepEntities?.length ?? 1);
      const quote = calculateEuRepQuote(entityCount);
      const session = checkoutSessions.create({
        status: 'pending',
        kind: input.kind,
        siteCount: entityCount,
        amount: quote.amountDue,
        generatorAmount: 0,
        listPrice: quote.amountDue,
        discountRate: 0,
        discountAmount: 0,
        currency: 'CHF',
        euRepEntityCount: entityCount,
        euRepEntities: input.euRepEntities,
      });

      return HttpResponse.json(
        {
          id: session.id,
          redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
          amount: session.amount,
          currency: session.currency,
          siteCount: session.siteCount,
          listPrice: session.listPrice,
          discountRate: session.discountRate,
          discountAmount: session.discountAmount,
        },
        { status: 201 }
      );
    }

    const activeSites = countActivePolicySites(subscriptions.all());
    const siteCount = Math.max(1, input.siteCount ?? 1);

    if (input.fillSubscriptionId && input.domain && input.kind === 'generator') {
      const slotSubscription = subscriptions
        .all()
        .find((row) => row.id === input.fillSubscriptionId);
      if (
        !slotSubscription ||
        slotSubscription.productType !== 'policy' ||
        slotSubscription.status !== 'active' ||
        countAvailablePolicySlots(slotSubscription, documents.all()) <= 0
      ) {
        return HttpResponse.json({ message: 'No subscription slot available' }, { status: 400 });
      }

      const euRepEntityCount = input.euRepEntityCount ?? input.euRepEntities?.length;
      let amount = 0;
      if (euRepEntityCount) {
        amount += calculateEuRepQuote(euRepEntityCount).amountDue;
      }

      const session = checkoutSessions.create({
        status: 'pending',
        kind: input.kind,
        siteCount: 1,
        amount,
        generatorAmount: 0,
        listPrice: 0,
        discountRate: 0,
        discountAmount: 0,
        currency: 'CHF',
        domain: input.domain,
        policyName: input.policyName,
        legalEntity: input.legalEntity,
        euRepEntityCount,
        euRepEntities: input.euRepEntities,
        euRepLinkContractId: input.euRepLinkContractId,
        fillSubscriptionId: input.fillSubscriptionId,
      });

      return HttpResponse.json(
        {
          id: session.id,
          redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
          amount: session.amount,
          currency: session.currency,
          siteCount: session.siteCount,
          listPrice: session.listPrice,
          discountRate: session.discountRate,
          discountAmount: session.discountAmount,
        },
        { status: 201 }
      );
    }

    const qualifyingSites = qualifyingSiteCountForCheckout(activeSites, input.kind, siteCount);
    const quote = calculateGeneratorPolicyQuote(qualifyingSites, siteCount);

    let amount = quote.amountDue;
    const euRepEntityCount = input.euRepEntityCount ?? input.euRepEntities?.length;
    if (euRepEntityCount) {
      amount += calculateEuRepQuote(euRepEntityCount).amountDue;
    }

    const session = checkoutSessions.create({
      status: 'pending',
      kind: input.kind,
      siteCount,
      amount,
      generatorAmount: quote.amountDue,
      listPrice: quote.listPrice,
      discountRate: quote.discountRate,
      discountAmount: quote.discountAmount,
      currency: 'CHF',
      domain: input.domain,
      policyName: input.policyName,
      legalEntity: input.legalEntity,
      euRepEntityCount,
      euRepEntities: input.euRepEntities,
      euRepLinkContractId: input.euRepLinkContractId,
      subscriptionId: input.subscriptionId,
    });

    return HttpResponse.json(
      {
        id: session.id,
        redirectUrl: `/checkout/payrexx?sessionId=${session.id}`,
        amount: session.amount,
        currency: session.currency,
        siteCount: session.siteCount,
        listPrice: session.listPrice,
        discountRate: session.discountRate,
        discountAmount: session.discountAmount,
      },
      { status: 201 }
    );
  }),

  http.post('/api/checkout/sessions/:id/complete', ({ params }) => {
    const completed = completeCheckoutSession(String(params.id));
    if (!completed) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const policySub = completed.subscriptionId
      ? subscriptions.all().find((row) => row.id === completed.subscriptionId)
      : subscriptions.all().find((row) => row.productType === 'policy' && row.status === 'active');
    const document = completed.documentId
      ? documents.all().find((row) => row.id === completed.documentId)
      : undefined;

    const createdContractIds =
      completed.euRepContractIds ?? (completed.euRepContractId ? [completed.euRepContractId] : []);
    const unlinkedHosted = documents
      .all()
      .filter((row) => !row.euRepContractId && !row.euRepLinked);
    const needsPolicyLinking =
      completed.kind === 'euRep' && createdContractIds.length > 0 && unlinkedHosted.length > 0;

    return HttpResponse.json({
      sessionId: completed.id,
      orderId: completed.orderId,
      document: document ? presentDocument(document) : undefined,
      activeSubscriptionCount: countActivePolicySubscriptions(subscriptions.all()),
      nextPaymentDate: policySub?.nextPaymentDate ?? null,
      discountRate: completed.discountRate > 0 ? completed.discountRate : undefined,
      discountAmount: completed.discountAmount > 0 ? completed.discountAmount : undefined,
      needsPolicyLinking,
      euRepContractId: createdContractIds[0],
      euRepContractIds: createdContractIds,
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
