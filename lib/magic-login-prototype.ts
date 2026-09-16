/** Prototype-only: last admin magic-link URL from identify (for dev toolbar). */
export const MAGIC_LOGIN_URL_STORAGE_KEY = 'mp-mock:last-magic-login-url';

export function storePrototypeMagicLoginUrl(url: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(MAGIC_LOGIN_URL_STORAGE_KEY, url);
}

export function readPrototypeMagicLoginUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(MAGIC_LOGIN_URL_STORAGE_KEY);
}
