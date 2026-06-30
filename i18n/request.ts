import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from './config';

/**
 * Cookie-based locale (no locale prefix in URLs) — the simple setup that
 * fits prototypes. Production projects can migrate to routed locales
 * without touching any useTranslations() call sites.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const candidate = store.get(LOCALE_COOKIE)?.value;
  const locale = locales.includes(candidate as Locale) ? (candidate as Locale) : defaultLocale;

  return {
    locale,
    messages: ((await import(`@/messages/${locale}.json`)) as { default: Record<string, unknown> })
      .default,
  };
});
