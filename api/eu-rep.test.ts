import { describe, expect, it } from 'vitest';
import type { Subscription } from '@/api/billing';
import {
  canDeleteEuRepEntity,
  findEuRepContractForLegalEntity,
  type EuRepContract,
} from '@/api/eu-rep';

function subscription(id: string, status: Subscription['status']): Subscription {
  return {
    id,
    productType: 'euRep',
    product: 'EU Representation',
    status,
    startDate: '2026-01-01',
    lastOrderDate: '2026-01-01',
    nextPaymentDate: '2027-01-01',
    totals: {
      product: 'EU Representation',
      subtotal: 149,
      discount: 0,
      total: 149,
      currency: 'CHF',
    },
    relatedOrderIds: [],
  };
}

const contracts: EuRepContract[] = [
  {
    id: '1',
    subscriptionId: 'sub-1',
    legalEntity: 'Baumgartner Digital AG',
    forwardingEmail: 'privacy@example.com',
    postalLine1: 'Bahnhofstrasse 12',
    postalCode: '8001',
    city: 'Zürich',
    country: 'Schweiz',
    linkedDocumentIds: ['1', '6'],
    status: 'active',
  },
  {
    id: '2',
    subscriptionId: 'sub-2',
    legalEntity: 'Alpenblick Hospitality AG',
    forwardingEmail: 'privacy@alpenblick-hotel.ch',
    postalLine1: 'Seestrasse 8',
    postalCode: '3800',
    city: 'Interlaken',
    country: 'Schweiz',
    linkedDocumentIds: ['3'],
    status: 'active',
  },
];

describe('findEuRepContractForLegalEntity', () => {
  it('matches an active contract by legal entity name', () => {
    expect(findEuRepContractForLegalEntity(contracts, 'baumgartner digital ag')?.id).toBe('1');
  });

  it('returns undefined when no active contract matches', () => {
    expect(findEuRepContractForLegalEntity(contracts, 'Unknown GmbH')).toBeUndefined();
  });

  it('ignores cancelled contracts', () => {
    const withCancelled: EuRepContract[] = [
      ...contracts,
      {
        id: '3',
        subscriptionId: 'sub-3',
        legalEntity: 'Unknown GmbH',
        forwardingEmail: 'privacy@unknown.ch',
        postalLine1: 'Teststrasse 1',
        postalCode: '3000',
        city: 'Bern',
        country: 'Schweiz',
        linkedDocumentIds: [],
        status: 'cancelled',
      },
    ];

    expect(findEuRepContractForLegalEntity(withCancelled, 'Unknown GmbH')).toBeUndefined();
  });

  it('ignores an active contract whose subscription is cancelled', () => {
    expect(
      findEuRepContractForLegalEntity(contracts, 'Baumgartner Digital AG', [
        subscription('sub-1', 'cancelled'),
      ])
    ).toBeUndefined();
  });

  it('matches when the subscription is still active', () => {
    expect(
      findEuRepContractForLegalEntity(contracts, 'Baumgartner Digital AG', [
        subscription('sub-1', 'active'),
      ])?.id
    ).toBe('1');
  });
});

describe('canDeleteEuRepEntity', () => {
  it('blocks delete while the subscription is billed', () => {
    expect(canDeleteEuRepEntity(subscription('sub-1', 'active'))).toBe(false);
    expect(canDeleteEuRepEntity(subscription('sub-1', 'processing'))).toBe(false);
  });

  it('allows delete after cancel or expiry', () => {
    expect(canDeleteEuRepEntity(subscription('sub-1', 'cancelled'))).toBe(true);
    expect(canDeleteEuRepEntity(subscription('sub-1', 'expired'))).toBe(true);
    expect(canDeleteEuRepEntity(undefined)).toBe(true);
  });
});
