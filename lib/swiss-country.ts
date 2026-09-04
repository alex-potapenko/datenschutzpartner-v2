const SWISS_COUNTRY_VALUES = new Set(['schweiz', 'switzerland', 'ch']);

/** Whether a stored country value refers to Switzerland (our fixed default). */
export function isSwissCountryValue(value: string | undefined | null): boolean {
  if (!value?.trim()) return true;
  return SWISS_COUNTRY_VALUES.has(value.trim().toLowerCase());
}

/** Map stored Switzerland values to the locale-specific label. */
export function displayCountryLabel(stored: string | undefined | null, swissLabel: string): string {
  if (isSwissCountryValue(stored)) return swissLabel;
  return stored?.trim() ?? swissLabel;
}

/** Canonical value persisted to the API for Swiss addresses. */
export const SWISS_COUNTRY_STORAGE = 'Schweiz';
