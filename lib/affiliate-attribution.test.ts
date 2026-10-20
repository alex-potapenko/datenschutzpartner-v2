import { describe, expect, it } from 'vitest';
import {
  affiliateReferralUrl,
  normalizeAffiliateTargetPath,
  safeTargetPath,
} from './affiliate-attribution';

describe('affiliateReferralUrl', () => {
  it('builds the base partner link without a target', () => {
    expect(affiliateReferralUrl('karin')).toBe('https://datenschutzpartner.com/ref/karin');
  });

  it('appends target page and campaign', () => {
    expect(affiliateReferralUrl('karin', { targetPath: '/scan', campaign: 'newsletter' })).toBe(
      'https://datenschutzpartner.com/ref/karin?to=/scan&campaign=newsletter'
    );
  });
});

describe('normalizeAffiliateTargetPath', () => {
  it.each([
    ['', '/'],
    ['/scan', '/scan'],
    ['scan', '/scan'],
    ['eu-rep/questionnaire', '/eu-rep/questionnaire'],
    ['datenschutzpartner.ch/eu-rep', '/eu-rep'],
    ['https://www.datenschutzpartner.com/scan?plan=pro', '/scan?plan=pro'],
  ])('maps %s to %s', (input, expected) => {
    expect(normalizeAffiliateTargetPath(input)).toBe(expected);
  });

  it.each(['https://example.com/scan', 'example.com/scan', '//evil.test', '/ref/other'])(
    'rejects %s',
    (input) => {
      expect(normalizeAffiliateTargetPath(input)).toBeNull();
    }
  );
});

describe('safeTargetPath', () => {
  it('rejects protocol-relative and backslash paths', () => {
    expect(safeTargetPath('//evil.test')).toBeNull();
    expect(safeTargetPath('/\\evil.test')).toBeNull();
    expect(safeTargetPath('/scan')).toBe('/scan');
  });
});
