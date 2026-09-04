import { describe, expect, it } from 'vitest';
import {
  ADD_EU_REP_CHECKOUT_HREF,
  ADD_WEBSITE_WIZARD_HREF,
  accountLocationHref,
  addEuRepCheckoutHref,
  addWebsiteWizardHref,
  privacyPolicyAccountHref,
  safeAccountReturnTo,
  safeEuRepCheckoutReturnTo,
  withReturnTo,
} from './account-routes';

describe('safeAccountReturnTo', () => {
  it('accepts account paths', () => {
    expect(safeAccountReturnTo('/account?section=overview')).toBe('/account?section=overview');
    expect(safeAccountReturnTo('/account?accountScope=euRep&section=euRep')).toBe(
      '/account?accountScope=euRep&section=euRep'
    );
  });

  it('rejects external or non-account targets', () => {
    expect(safeAccountReturnTo('/')).toBeUndefined();
    expect(safeAccountReturnTo('/result?step=website')).toBeUndefined();
    expect(safeAccountReturnTo('https://evil.example/account')).toBeUndefined();
    expect(safeAccountReturnTo('//evil.example/account')).toBeUndefined();
    expect(safeAccountReturnTo(null)).toBeUndefined();
  });
});

describe('safeEuRepCheckoutReturnTo', () => {
  it('accepts account and eu-rep landing paths', () => {
    expect(safeEuRepCheckoutReturnTo('/account?accountScope=euRep&section=euRep')).toBe(
      '/account?accountScope=euRep&section=euRep'
    );
    expect(safeEuRepCheckoutReturnTo('/eu-rep#plans')).toBe('/eu-rep#plans');
    expect(safeEuRepCheckoutReturnTo('/eu-rep?foo=bar')).toBe('/eu-rep?foo=bar');
  });

  it('rejects other targets', () => {
    expect(safeEuRepCheckoutReturnTo('/scan')).toBeUndefined();
    expect(safeEuRepCheckoutReturnTo('https://evil.example/eu-rep')).toBeUndefined();
  });
});

describe('privacyPolicyAccountHref', () => {
  it('opens privacy policy for a site on the preview tab', () => {
    expect(privacyPolicyAccountHref({ site: 'microsoft.com', tab: 'preview' })).toBe(
      '/account?accountScope=websites&section=privacyPolicy&site=microsoft.com&tab=preview'
    );
  });
});

describe('accountLocationHref', () => {
  it('joins the current account location', () => {
    expect(accountLocationHref('/account', new URLSearchParams('section=privacyPolicy'))).toBe(
      '/account?section=privacyPolicy'
    );
  });

  it('ignores non-account locations', () => {
    expect(accountLocationHref('/scan', new URLSearchParams())).toBeUndefined();
  });
});

describe('withReturnTo', () => {
  it('appends a safe returnTo to wizard and checkout hrefs', () => {
    expect(addWebsiteWizardHref('/account?section=overview')).toBe(
      `${ADD_WEBSITE_WIZARD_HREF}&returnTo=${encodeURIComponent('/account?section=overview')}`
    );
    expect(addEuRepCheckoutHref('/account?accountScope=euRep&section=euRep')).toBe(
      `${ADD_EU_REP_CHECKOUT_HREF}?returnTo=${encodeURIComponent('/account?accountScope=euRep&section=euRep')}`
    );
    expect(withReturnTo(ADD_WEBSITE_WIZARD_HREF, '/')).toBe(ADD_WEBSITE_WIZARD_HREF);
  });
});
