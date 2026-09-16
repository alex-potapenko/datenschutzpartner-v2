import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  buildOtpauthUri,
  formatTotpSecret,
  generateTotpCode,
  generateTotpSecret,
  normalizeTotpSecret,
  totpSecondsRemaining,
  verifyTotpCode,
} from './totp';

/** RFC 6238 appendix B seed "12345678901234567890" in Base32. */
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('base32', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = Uint8Array.from([0, 1, 127, 128, 255, 42, 7]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });

  it('decodes the RFC test seed to its ASCII bytes', () => {
    expect(new TextDecoder().decode(base32Decode(RFC_SECRET))).toBe('12345678901234567890');
  });

  it('accepts secrets typed with spaces and lowercase', () => {
    expect(normalizeTotpSecret('gezd gnbv gy3t qojq')).toBe('GEZDGNBVGY3TQOJQ');
  });
});

describe('generateTotpCode', () => {
  // Six-digit truncations of the SHA-1 vectors in RFC 6238 appendix B.
  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ])('matches the RFC vector at T=%i', async (seconds, expected) => {
    await expect(generateTotpCode(RFC_SECRET, seconds * 1000)).resolves.toBe(expected);
  });
});

describe('verifyTotpCode', () => {
  const now = 1234567890 * 1000;

  it('accepts the current code', async () => {
    await expect(verifyTotpCode(RFC_SECRET, '005924', { timestampMs: now })).resolves.toBe(true);
  });

  it('tolerates one period of clock drift in both directions', async () => {
    const previous = await generateTotpCode(RFC_SECRET, now - 30_000);
    const next = await generateTotpCode(RFC_SECRET, now + 30_000);

    await expect(verifyTotpCode(RFC_SECRET, previous, { timestampMs: now })).resolves.toBe(true);
    await expect(verifyTotpCode(RFC_SECRET, next, { timestampMs: now })).resolves.toBe(true);
  });

  it('rejects codes beyond the accepted window', async () => {
    const stale = await generateTotpCode(RFC_SECRET, now - 120_000);
    await expect(verifyTotpCode(RFC_SECRET, stale, { timestampMs: now })).resolves.toBe(false);
  });

  it('rejects malformed input', async () => {
    await expect(verifyTotpCode(RFC_SECRET, '12345', { timestampMs: now })).resolves.toBe(false);
    await expect(verifyTotpCode(RFC_SECRET, 'abcdef', { timestampMs: now })).resolves.toBe(false);
  });
});

describe('secret and URI helpers', () => {
  it('generates a 32-character Base32 secret', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  });

  it('groups the secret for manual entry', () => {
    expect(formatTotpSecret(RFC_SECRET)).toBe('GEZD GNBV GY3T QOJQ GEZD GNBV GY3T QOJQ');
  });

  it('builds an otpauth URI authenticator apps understand', () => {
    const uri = buildOtpauthUri({
      secret: RFC_SECRET,
      accountName: 'jane@example.com',
      issuer: 'Datenschutzpartner',
    });

    expect(uri).toContain('otpauth://totp/Datenschutzpartner:jane%40example.com?');
    expect(uri).toContain(`secret=${RFC_SECRET}`);
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });

  it('counts down within one period', () => {
    expect(totpSecondsRemaining(0)).toBe(30);
    expect(totpSecondsRemaining(25_000)).toBe(5);
  });
});
