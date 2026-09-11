export type DpoDesignationLocale = 'en' | 'de';

const STANDARD_DPO_DESIGNATIONS: ReadonlyArray<Record<DpoDesignationLocale, string>> = [
  { en: 'Data protection officer', de: 'Datenschutzbeauftragter' },
  { en: 'Data Protection Officer', de: 'Datenschutzbeauftragter' },
  { en: 'Chief Data Protection Officer', de: 'Leitender Datenschutzbeauftragter' },
  { en: 'Privacy officer', de: 'Datenschutzbeauftragter' },
];

function normalizeDesignation(value: string) {
  return value.trim().toLocaleLowerCase();
}

/** Returns a standard translation when the source matches a known DPO title. */
export function translateDpoDesignation(
  value: string,
  targetLocale: DpoDesignationLocale
): string | null {
  const normalized = normalizeDesignation(value);
  if (!normalized) return null;

  for (const term of STANDARD_DPO_DESIGNATIONS) {
    const sourceLocale: DpoDesignationLocale = targetLocale === 'en' ? 'de' : 'en';
    if (normalizeDesignation(term[sourceLocale]) === normalized) {
      return term[targetLocale];
    }
  }

  return null;
}
