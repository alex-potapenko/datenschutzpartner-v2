/** Next payout run date (YYYY-MM-DD), anchored on the 1st of each cadence month (Jan + k×cadence). */
export function nextAffiliatePayoutDateIso(from: Date, cadenceMonths: number): string {
  if (!Number.isInteger(cadenceMonths) || cadenceMonths < 1 || cadenceMonths > 12) {
    throw new Error('invalid_payout_cadence');
  }

  const todayUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const candidates: number[] = [];

  for (let year = from.getFullYear(); year <= from.getFullYear() + 2; year += 1) {
    for (let month = 1; month <= 12; month += cadenceMonths) {
      const ts = Date.UTC(year, month - 1, 1);
      if (ts >= todayUtc) {
        candidates.push(ts);
      }
    }
  }

  candidates.sort((a, b) => a - b);
  const next = candidates[0];
  if (next === undefined) {
    throw new Error('next_payout_date_not_found');
  }

  const date = new Date(next);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
