import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadAboutClosingMarkdown(locale: string): string {
  const file = locale === 'en' ? 'about-closing.en.md' : 'about-closing.de.md';
  return readFileSync(join(process.cwd(), 'content', file), 'utf-8');
}
