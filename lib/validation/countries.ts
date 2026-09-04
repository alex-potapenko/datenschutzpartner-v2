import { COUNTRY_CODES, countryNameForCode } from '@/lib/countries';

const KNOWN_COUNTRY_NAMES = new Set(
  COUNTRY_CODES.flatMap((code) => [countryNameForCode(code, 'de'), countryNameForCode(code, 'en')])
);

export function isKnownCountryName(value: string): boolean {
  return KNOWN_COUNTRY_NAMES.has(value.trim());
}
