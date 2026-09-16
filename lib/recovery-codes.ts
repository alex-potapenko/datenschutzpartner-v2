/**
 * One-time recovery codes for accounts that lose access to their
 * authenticator app. Crockford-style alphabet without the characters that
 * get misread when codes are written down by hand.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GROUP_LENGTH = 5;
const GROUPS_PER_CODE = 2;

export const RECOVERY_CODE_COUNT = 10;

function randomChars(length: number): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET.charAt(byte % ALPHABET.length)).join('');
}

export function generateRecoveryCode(): string {
  return Array.from({ length: GROUPS_PER_CODE }, () => randomChars(GROUP_LENGTH)).join('-');
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(generateRecoveryCode());
  }
  return [...codes];
}

/** Users retype codes without the dash or in lowercase — both must match. */
export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}

export function recoveryCodesMatch(a: string, b: string): boolean {
  return normalizeRecoveryCode(a) === normalizeRecoveryCode(b);
}

export function formatRecoveryCodesForDownload(codes: string[], accountName: string): string {
  const header = [
    'Datenschutzpartner — recovery codes',
    `Account: ${accountName}`,
    `Created: ${new Date().toISOString()}`,
    '',
    'Each code can be used once instead of your authenticator code.',
    'Keep them somewhere safe and offline.',
    '',
  ];

  return [...header, ...codes].join('\n');
}
