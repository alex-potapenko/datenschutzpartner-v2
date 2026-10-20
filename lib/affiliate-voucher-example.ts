/** Suggested voucher code for draft copy, e.g. LUCAS20 from first name Lucas and 20% discount. */
export function affiliateVoucherExampleCode(
  firstName: string | undefined,
  discountPercent = 20
): string {
  let prefix = (firstName ?? '')
    .trim()
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
  if (prefix.length < 3) prefix = 'PARTNER';
  if (prefix.length > 14) prefix = prefix.slice(0, 14);
  return `${prefix}${discountPercent}`;
}
