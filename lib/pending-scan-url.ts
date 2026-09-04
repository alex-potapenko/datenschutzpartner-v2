const PENDING_SCAN_URL_KEY = 'datenschutzpartner-pending-scan-url';

/** One-shot URL from the landing scan form — consumed by the website step. */
export function writePendingScanUrl(url: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PENDING_SCAN_URL_KEY, url);
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Read and clear the landing-to-wizard scan URL. */
export function consumePendingScanUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = sessionStorage.getItem(PENDING_SCAN_URL_KEY)?.trim() ?? '';
    sessionStorage.removeItem(PENDING_SCAN_URL_KEY);
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}
