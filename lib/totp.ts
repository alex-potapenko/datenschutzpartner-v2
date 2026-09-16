/**
 * RFC 6238 TOTP — the codes verified here are the ones a real authenticator
 * app (Google Authenticator, 1Password, …) produces from the same secret.
 *
 * Authenticator apps assume HMAC-SHA1 / 6 digits / 30s and ignore deviating
 * `algorithm`, `digits` and `period` parameters in the otpauth URI, so these
 * values are fixed rather than configurable.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const SECRET_BYTE_LENGTH = 20;

export const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SECONDS = 30;
/** Accepted drift in either direction, in periods — covers unsynced phone clocks. */
export const TOTP_VERIFY_WINDOW = 1;

function webCrypto(): Crypto {
  // Undefined outside secure contexts, e.g. a dev server reached over http://<LAN-IP>.
  const available = globalThis.crypto as Crypto | undefined;
  if (!available?.subtle) {
    throw new Error(
      'Web Crypto is unavailable. Serve the app over HTTPS or via localhost (a secure context).'
    );
  }
  return available;
}

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(SECRET_BYTE_LENGTH);
  webCrypto().getRandomValues(bytes);
  return base32Encode(bytes);
}

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET.charAt((value >>> (bits - 5)) & 31);
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET.charAt((value << (5 - bits)) & 31);
  }

  return output;
}

export function base32Decode(secret: string): Uint8Array {
  const normalized = normalizeTotpSecret(secret);
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Uint8Array.from(bytes);
}

/** Uppercases and strips the spaces and padding users paste from their app. */
export function normalizeTotpSecret(secret: string): string {
  return secret.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();
}

/** Grouped into blocks of four so the secret can be typed in by hand. */
export function formatTotpSecret(secret: string): string {
  return totpSecretGroups(secret).join(' ');
}

/** Four-character chunks — each group must not break across lines in the UI. */
export function totpSecretGroups(secret: string): string[] {
  const normalized = normalizeTotpSecret(secret);
  const groups: string[] = [];
  for (let index = 0; index < normalized.length; index += 4) {
    groups.push(normalized.slice(index, index + 4));
  }
  return groups;
}

export function buildOtpauthUri({
  secret,
  accountName,
  issuer,
}: {
  secret: string;
  accountName: string;
  issuer: string;
}): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  const params = new URLSearchParams({
    secret: normalizeTotpSecret(secret),
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

export function totpCounter(timestampMs: number = Date.now()): number {
  return Math.floor(timestampMs / 1000 / TOTP_PERIOD_SECONDS);
}

/** Seconds left before the currently displayed code rolls over. */
export function totpSecondsRemaining(timestampMs: number = Date.now()): number {
  return TOTP_PERIOD_SECONDS - (Math.floor(timestampMs / 1000) % TOTP_PERIOD_SECONDS);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const subtle = webCrypto().subtle;
  const cryptoKey = await subtle.importKey(
    'raw',
    key as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await subtle.sign('HMAC', cryptoKey, message as unknown as BufferSource);
  return new Uint8Array(signature);
}

function counterBytes(counter: number): Uint8Array {
  const bytes = new Uint8Array(8);
  let remaining = counter;
  for (let index = 7; index >= 0; index -= 1) {
    bytes[index] = remaining & 255;
    remaining = Math.floor(remaining / 256);
  }
  return bytes;
}

export async function generateTotpCode(
  secret: string,
  timestampMs: number = Date.now()
): Promise<string> {
  return generateTotpCodeForCounter(secret, totpCounter(timestampMs));
}

async function generateTotpCodeForCounter(secret: string, counter: number): Promise<string> {
  const digest = await hmacSha1(base32Decode(secret), counterBytes(counter));
  const offset = (digest[digest.length - 1] ?? 0) & 15;
  const binary =
    (((digest[offset] ?? 0) & 127) << 24) |
    (((digest[offset + 1] ?? 0) & 255) << 16) |
    (((digest[offset + 2] ?? 0) & 255) << 8) |
    ((digest[offset + 3] ?? 0) & 255);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function verifyTotpCode(
  secret: string,
  code: string,
  {
    timestampMs = Date.now(),
    window = TOTP_VERIFY_WINDOW,
  }: { timestampMs?: number; window?: number } = {}
): Promise<boolean> {
  const candidate = code.replace(/\s/g, '');
  if (!new RegExp(`^\\d{${String(TOTP_DIGITS)}}$`).test(candidate)) {
    return false;
  }

  const counter = totpCounter(timestampMs);
  for (let drift = -window; drift <= window; drift += 1) {
    const expected = await generateTotpCodeForCounter(secret, counter + drift);
    if (timingSafeEquals(expected, candidate)) {
      return true;
    }
  }

  return false;
}
