import { describe, expect, it } from 'vitest';
import { findEuRepContractForLegalEntity, type EuRepContract } from '@/api/eu-rep';

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
});
