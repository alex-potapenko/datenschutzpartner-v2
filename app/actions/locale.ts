'use server';

import { cookies } from 'next/headers';
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from '@/i18n/config';

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
}

export async function getStoredLocale(): Promise<Locale> {
  const store = await cookies();
  const candidate = store.get(LOCALE_COOKIE)?.value;
  return locales.includes(candidate as Locale) ? (candidate as Locale) : defaultLocale;
}
