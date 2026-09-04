import { describe, expect, it } from 'vitest';
import {
  companyNameField,
  domainField,
  euRepEntityFieldsSchema,
  normalizeAndValidateWebsiteUrl,
  personNameField,
  postalCodeField,
} from '@/lib/validation';

describe('normalizeAndValidateWebsiteUrl', () => {
  it('accepts valid domains with or without protocol', () => {
    expect(normalizeAndValidateWebsiteUrl('example.com')).toBe('https://example.com');
    expect(normalizeAndValidateWebsiteUrl('https://www.example.com/path')).toBe(
      'https://www.example.com/path'
    );
  });

  it('rejects random text and hostnames without a TLD', () => {
    expect(normalizeAndValidateWebsiteUrl('asdf')).toBeNull();
    expect(normalizeAndValidateWebsiteUrl('!!!')).toBeNull();
    expect(normalizeAndValidateWebsiteUrl('')).toBeNull();
  });
});

describe('personNameField', () => {
  it('accepts real names', () => {
    expect(personNameField.safeParse('Anna').success).toBe(true);
    expect(personNameField.safeParse('Jean-Luc').success).toBe(true);
  });

  it('rejects random text', () => {
    expect(personNameField.safeParse('!').success).toBe(false);
    expect(personNameField.safeParse('x').success).toBe(false);
  });
});

describe('companyNameField', () => {
  it('accepts company names with numbers', () => {
    expect(companyNameField.safeParse('Oso AG').success).toBe(true);
    expect(companyNameField.safeParse('Studio 42 GmbH').success).toBe(true);
  });

  it('rejects gibberish', () => {
    expect(companyNameField.safeParse('!!!').success).toBe(false);
    expect(companyNameField.safeParse('1').success).toBe(false);
  });
});

describe('domainField', () => {
  it('accepts hostnames', () => {
    expect(domainField.safeParse('oso.com').success).toBe(true);
  });

  it('rejects invalid domains', () => {
    expect(domainField.safeParse('not a domain').success).toBe(false);
  });
});

describe('postalCodeField', () => {
  it('accepts Swiss and international postal codes', () => {
    expect(postalCodeField.safeParse('8001').success).toBe(true);
    expect(postalCodeField.safeParse('SW1A 1AA').success).toBe(true);
  });

  it('rejects too-short values', () => {
    expect(postalCodeField.safeParse('1').success).toBe(false);
  });
});

describe('euRepEntityFieldsSchema', () => {
  it('requires a known country name', () => {
    const result = euRepEntityFieldsSchema.safeParse({
      legalEntity: 'Oso AG',
      forwardingEmail: 'info@oso.com',
      postalLine1: 'Bahnhofstrasse 1',
      postalLine2: '',
      postalCode: '8001',
      city: 'Zürich',
      country: 'xyz123',
    });

    expect(result.success).toBe(false);
  });
});
