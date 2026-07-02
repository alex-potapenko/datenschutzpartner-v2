import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type LegalDocumentId = 'imprint' | 'privacy' | 'terms';

const CONTENT_DIR = join(process.cwd(), 'content/legal');

/** Legal copy is authoritative in German regardless of UI locale. */
export function loadLegalMarkdown(document: LegalDocumentId): string {
  return readFileSync(join(CONTENT_DIR, `${document}.de.md`), 'utf-8');
}
