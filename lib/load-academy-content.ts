import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locale } from '@/i18n/config';

export function loadAcademyBody(slug: string, locale: Locale, fallback: string): string {
  const file = join(process.cwd(), 'content/academy', `${slug}.${locale}.md`);

  try {
    return readFileSync(file, 'utf-8');
  } catch {
    return fallback;
  }
}
