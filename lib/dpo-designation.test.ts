import { describe, expect, it } from 'vitest';
import { translateDpoDesignation } from './dpo-designation';

describe('translateDpoDesignation', () => {
  it('translates standard English titles to German', () => {
    expect(translateDpoDesignation('Data protection officer', 'de')).toBe(
      'Datenschutzbeauftragter'
    );
  });

  it('translates standard German titles to English', () => {
    expect(translateDpoDesignation('Datenschutzbeauftragter', 'en')).toBe(
      'Data protection officer'
    );
  });

  it('returns null for custom titles', () => {
    expect(translateDpoDesignation('Jane Doe', 'de')).toBeNull();
  });
});
