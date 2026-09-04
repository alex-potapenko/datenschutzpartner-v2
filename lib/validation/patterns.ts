/** Shared text patterns for form validation. */

export const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}'.\-\s]{1,99}$/u;
export const COMPANY_NAME_PATTERN = /^(?=.*\p{L})[\p{L}\p{N}&.,'()/\-\s]{2,200}$/u;
export const STREET_ADDRESS_PATTERN = /^(?=.*\p{L})[\p{L}\p{N}\s.,'#/\-]{3,200}$/u;
export const CITY_NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]{1,98}$/u;
export const POSTAL_CODE_PATTERN = /^[A-Z0-9][A-Z0-9\s-]{2,11}$/i;
export const DOMAIN_HOST_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
export const VAT_ID_PATTERN = /^[A-Z]{2}[A-Z0-9.\-\s]{2,16}$/i;

export function countLetters(value: string): number {
  return value.match(/\p{L}/gu)?.length ?? 0;
}
