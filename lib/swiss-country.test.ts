import { describe, expect, it } from 'vitest';
import { displayCountryLabel, isSwissCountryValue } from './swiss-country';

describe('swiss-country', () => {
  it('detects stored Swiss country values', () => {
    expect(isSwissCountryValue('Schweiz')).toBe(true);
    expect(isSwissCountryValue('Switzerland')).toBe(true);
    expect(isSwissCountryValue('')).toBe(true);
    expect(isSwissCountryValue('Germany')).toBe(false);
  });

  it('maps Swiss storage values to the locale label', () => {
    expect(displayCountryLabel('Schweiz', 'Switzerland')).toBe('Switzerland');
    expect(displayCountryLabel('Switzerland', 'Schweiz')).toBe('Schweiz');
    expect(displayCountryLabel('Germany', 'Switzerland')).toBe('Germany');
  });
});
