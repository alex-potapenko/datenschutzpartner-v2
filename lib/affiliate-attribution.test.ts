import { describe, expect, it } from 'vitest';
import {
  affiliateReferralUrl,
  affiliateTargetPathFromMarketingSegment,
  normalizeAffiliateTargetPath,
  safeTargetPath,
  splitPartnerReferralLinkDisplay,
} from './affiliate-attribution';

describe('affiliateReferralUrl', () => {
  it('builds the base partner link without a target', () => {
    expect(affiliateReferralUrl('356')).toBe('https://www.datenschutzpartner.ch/ref/356/');
  });

  it('embeds ref in the marketing page path without query params (Phase 1)', () => {
    expect(affiliateReferralUrl('356', { targetPath: '/scan' })).toBe(
      'https://www.datenschutzpartner.ch/angebot-datenschutz-generator/ref/356/'
    );
  });

  it('appends optional campaign as a query param (A-21)', () => {
    expect(
      affiliateReferralUrl('356', { targetPath: '/scan', campaign: 'newsletter-spring' })
    ).toBe(
      'https://www.datenschutzpartner.ch/angebot-datenschutz-generator/ref/356/?campaign=newsletter-spring'
    );
  });
});

describe('splitPartnerReferralLinkDisplay', () => {
  it('splits marketing page and ref tail', () => {
    expect(
      splitPartnerReferralLinkDisplay(
        'https://www.datenschutzpartner.ch/angebot-datenschutz-generator/ref/356/'
      )
    ).toEqual({
      hostPrefix: 'www.datenschutzpartner.ch/',
      marketingPage: 'angebot-datenschutz-generator',
      refSuffix: '/ref/356/',
    });
  });

  it('handles the base partner link without a marketing page', () => {
    expect(splitPartnerReferralLinkDisplay('https://www.datenschutzpartner.ch/ref/356/')).toEqual({
      hostPrefix: 'www.datenschutzpartner.ch/',
      marketingPage: null,
      refSuffix: 'ref/356/',
    });
  });
});

describe('affiliateTargetPathFromMarketingSegment', () => {
  it('maps known marketing paths back to app routes', () => {
    expect(affiliateTargetPathFromMarketingSegment('angebot-eu-datenschutz-vertretung')).toBe(
      '/eu-rep'
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
    ['https://www.datenschutzpartner.ch/angebot-datenschutz-generator/ref/356/', '/scan'],
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
    expect(safeTargetPath('/angebot/ref/356')).toBeNull();
  });
});
