'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/components/ui';
import type { GeneratedDocument } from '@/api/documents';
import { resolveDocumentSite } from '@/api/documents';
import { EU_REP_REPRESENTATIVE } from '@/api/eu-rep';

/** Ordered section keys — labels live under `policyDocument.sections.*`. */
const POLICY_SECTION_KEYS = [
  'controller',
  'euRepresentative',
  'dataWeProcess',
  'legalBases',
  'cookies',
  'transfers',
  'rights',
  'contact',
] as const;

const RIGHTS_ITEM_COUNT = 6;

const ART27_HREF: Record<string, string> = {
  de: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679',
  en: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
};

function policyLinkClassName() {
  return 'text-accent underline decoration-transparent decoration-1 underline-offset-[3px] transition-[color,text-decoration-color] hover:text-[var(--link-hover)] hover:decoration-[var(--link-underline)]';
}

/** Art. 27 block inserted into hosted policies that are linked to an EU Rep contract. */
function EuRepresentativePolicyBlock() {
  const t = useTranslations('policyDocument.sections.euRepresentative');
  const locale = useLocale();
  const representative = EU_REP_REPRESENTATIVE;
  const art27Href = ART27_HREF[locale] ?? ART27_HREF.en;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-foreground leading-relaxed">
        {t.rich('intro', {
          art27: (chunks) => (
            <a
              href={art27Href}
              target="_blank"
              rel="noopener noreferrer"
              className={policyLinkClassName()}
            >
              {chunks}
            </a>
          ),
        })}
      </p>
      <p className="text-foreground leading-relaxed">
        <a
          href={representative.website}
          target="_blank"
          rel="noopener noreferrer"
          className={policyLinkClassName()}
        >
          {representative.name}
        </a>
        <br />
        {representative.street}
        <br />
        {representative.postalCode} {representative.city}
        <br />
        {t('country')}
        <br />
        <a href={`mailto:${representative.email}`} className={policyLinkClassName()}>
          {representative.email}
        </a>
      </p>
      <p className="text-foreground leading-relaxed">{t('closing')}</p>
    </div>
  );
}

interface PolicyDocumentProps {
  document: GeneratedDocument;
  className?: string;
  /**
   * When true, renders only the policy main column (used by hosted public pages).
   * Prefer `PolicyDocumentMain` in `PolicyDetailTabs`.
   */
  embedInPage?: boolean;
}

/** Page-level title block for the generated-policy step. */
export function PolicyDocumentHeader({ document }: { document: GeneratedDocument }) {
  const site = resolveDocumentSite(document);

  return (
    <h1 className="text-foreground min-w-0 text-2xl font-bold break-words sm:text-3xl">{site}</h1>
  );
}

/** Policy prose for the detail page main column — always the current live revision. */
export function PolicyDocumentMain({
  document,
  className,
}: {
  document: GeneratedDocument;
  className?: string;
}) {
  const site = resolveDocumentSite(document);

  return (
    <div className={cn('flex flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10', className)}>
      <PolicyDocumentBody site={site} showEuRepresentative={Boolean(document.euRepLinked)} />
    </div>
  );
}

/** Unified policy prose — all sections in one flow, without a card wrapper. */
function PolicyDocumentBody({
  site,
  showEuRepresentative,
}: {
  site: string;
  showEuRepresentative: boolean;
}) {
  const t = useTranslations('policyDocument.sections');
  const sections = POLICY_SECTION_KEYS.filter(
    (key) => key !== 'euRepresentative' || showEuRepresentative
  );

  return (
    <article className="flex flex-col gap-8">
      {sections.map((sectionKey, index) => (
        <div key={sectionKey} className="flex flex-col gap-3">
          <h2 className="text-foreground text-xl font-semibold">
            <span className="text-muted mr-2 font-mono text-sm">{index + 1}.</span>
            {t(`${sectionKey}.title`)}
          </h2>
          {sectionKey === 'euRepresentative' ? (
            <EuRepresentativePolicyBlock />
          ) : (
            <p className="text-foreground leading-relaxed">{t(`${sectionKey}.body`, { site })}</p>
          )}
          {sectionKey === 'rights' ? (
            <ul className="text-foreground flex list-disc flex-col gap-1.5 pl-5 leading-relaxed">
              {Array.from({ length: RIGHTS_ITEM_COUNT }, (_, i) => (
                <li key={i}>{t(`rights.items.${i}`)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </article>
  );
}

/** Read-only rendering of the current hosted privacy policy revision. */
export function PolicyDocument({ document, className, embedInPage = false }: PolicyDocumentProps) {
  if (embedInPage) {
    return <PolicyDocumentMain document={document} className={className} />;
  }

  return (
    <div className={cn('border-border flex flex-col border-r border-l', className)}>
      <PolicyDocumentHeader document={document} />
      <div aria-hidden className="border-border border-b" />
      <PolicyDocumentMain document={document} />
    </div>
  );
}
