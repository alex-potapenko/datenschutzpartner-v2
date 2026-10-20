import { describe, expect, it } from 'vitest';
import { affiliateVoucherExampleCode } from './affiliate-voucher-example';

describe('affiliateVoucherExampleCode', () => {
  it('builds a code from the user first name', () => {
    expect(affiliateVoucherExampleCode('Lucas', 20)).toBe('LUCAS20');
  });

  it('falls back when the name is too short', () => {
    expect(affiliateVoucherExampleCode('Al', 10)).toBe('PARTNER10');
  });
});
