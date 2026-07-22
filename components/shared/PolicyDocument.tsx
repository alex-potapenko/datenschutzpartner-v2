'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Clock, DownloadSimple, Globe, Tabs, cn } from '@/components/ui';
import type { GeneratedDocument, PolicyVersion } from '@/api/documents';
import { resolveDocumentSite } from '@/api/documents';
import {
  INSIGHT_ARTICLE_BODY_CLASS,
  INSIGHT_ARTICLE_CONTENT_CLASS,
  INSIGHT_ARTICLE_SIDEBAR_CLASS,
  INSIGHT_META_LABEL_CLASS,
  INSIGHT_META_VALUE_CLASS,
} from '@/app/insights/_components/insight-article-layout';

/** Ordered section keys — labels live under `policyDocument.sections.*`. */
const POLICY_SECTION_KEYS = [
  'controller',
  'dataWeProcess',
  'legalBases',
  'cookies',
  'transfers',
  'rights',
  'contact',
] as const;

const RIGHTS_ITEM_COUNT = 6;

function formatEffectiveDate(iso: string, locale: string): string {
  const intlLocale = locale === 'de' ? 'de-CH' : 'en-GB';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function fallbackVersion(document: GeneratedDocument): PolicyVersion {
  const year = Number(document.createdDate.slice(0, 4)) || new Date().getFullYear();
  return { year, effectiveDate: document.createdDate, current: true, changeSummary: 'initial' };
}

interface PolicyDocumentProps {
  document: GeneratedDocument;
  className?: string;
  /** When provided, renders an "Export HTML" action in the sidebar (page) or header (card). */
  onExport?: () => void;
  /**
   * When true, uses the insight-style two-column page layout (sidebar + unified
   * prose container) and omits the card chrome for `RegularPage` headers.
   */
  embedInPage?: boolean;
  /** When false, hides the year/version picker (e.g. right after purchase). Defaults to true. */
  showVersions?: boolean;
}

/** Page-level title block — pass to `RegularPage` `header` on `/account/policies/[id]`. */
export function PolicyDocumentHeader({ document }: { document: GeneratedDocument }) {
  const site = resolveDocumentSite(document);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <a
        href={`https://${site}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent inline-flex w-fit items-center gap-1.5 text-xs font-semibold tracking-wide uppercase transition-colors hover:text-[var(--link-hover)]"
      >
        <Globe size={14} aria-hidden />
        {site}
      </a>
      <h1 className="text-foreground text-2xl font-bold break-words sm:text-3xl">
        {document.name}
      </h1>
    </div>
  );
}

function PolicyDocumentSidebar({
  versions,
  selectedYear,
  onSelectYear,
  selectedVersion,
  onExport,
  showVersions,
}: {
  versions: PolicyVersion[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  selectedVersion: PolicyVersion;
  onExport?: () => void;
  showVersions: boolean;
}) {
  const t = useTranslations('policyDocument');
  const locale = useLocale();

  return (
    <aside className="flex flex-col gap-8">
      {showVersions ? (
        <div className="flex flex-col gap-3">
          <span className={INSIGHT_META_LABEL_CLASS}>{t('sidebarVersion')}</span>
          <ul className="flex flex-col gap-1">
            {versions.map((version) => {
              const active = version.year === selectedYear;
              return (
                <li key={version.year}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectYear(version.year);
                    }}
                    className={cn(
                      'font-display w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                      active ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-surface'
                    )}
                    aria-current={active ? 'true' : undefined}
                  >
                    {version.year}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <span className={INSIGHT_META_LABEL_CLASS}>{t('effectiveFrom')}</span>
        <time className={INSIGHT_META_VALUE_CLASS} dateTime={selectedVersion.effectiveDate}>
          {formatEffectiveDate(selectedVersion.effectiveDate, locale)}
        </time>
      </div>

      {showVersions && !selectedVersion.current ? (
        <div className="border-border bg-muted/5 text-muted flex items-start gap-2 rounded-xl border border-dashed p-3 text-sm">
          <Clock size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{t('archivedNote')}</span>
        </div>
      ) : null}

      {onExport ? (
        <Button variant="outline" size="sm" className="w-fit gap-2" onPress={onExport}>
          <DownloadSimple size={16} weight="bold" aria-hidden />
          {t('exportHtml')}
        </Button>
      ) : null}
    </aside>
  );
}

/** Unified policy prose — all sections in one flow, without a card wrapper. */
function PolicyDocumentBody({ site }: { site: string }) {
  const t = useTranslations('policyDocument.sections');

  return (
    <article className="flex flex-col gap-8">
      {POLICY_SECTION_KEYS.map((sectionKey, index) => (
        <div key={sectionKey} className="flex flex-col gap-3">
          <h2 className="text-foreground text-xl font-semibold">
            <span className="text-muted mr-2 font-mono text-sm">{index + 1}.</span>
            {t(`${sectionKey}.title`)}
          </h2>
          <p className="text-foreground leading-relaxed">{t(`${sectionKey}.body`, { site })}</p>
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

/**
 * Reusable read-only rendering of a hosted privacy policy: the live version plus
 * every past yearly revision. The member-area detail page uses a sidebar layout;
 * the post-payment card keeps horizontal year tabs.
 */
export function PolicyDocument({
  document,
  className,
  onExport,
  embedInPage = false,
  showVersions = true,
}: PolicyDocumentProps) {
  const t = useTranslations('policyDocument');
  const site = resolveDocumentSite(document);

  const versions = useMemo<[PolicyVersion, ...PolicyVersion[]]>(() => {
    const list = document.versions?.length ? [...document.versions] : [fallbackVersion(document)];
    const sorted = list.sort((a, b) => b.year - a.year);
    return [sorted[0] ?? fallbackVersion(document), ...sorted.slice(1)];
  }, [document]);

  const currentVersion = versions.find((version) => version.current) ?? versions[0];
  const [selectedYear, setSelectedYear] = useState<number>(currentVersion.year);
  const selected = versions.find((version) => version.year === selectedYear) ?? versions[0];

  if (embedInPage) {
    return (
      <div className={cn(INSIGHT_ARTICLE_BODY_CLASS, className)}>
        <div className={INSIGHT_ARTICLE_SIDEBAR_CLASS}>
          <PolicyDocumentSidebar
            versions={versions}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            selectedVersion={selected}
            onExport={onExport}
            showVersions={showVersions}
          />
        </div>
        <div className={INSIGHT_ARTICLE_CONTENT_CLASS}>
          <PolicyDocumentBody site={site} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border-border flex flex-col border-r border-l', className)}>
      <PolicyDocumentHeader document={document} />
      <div aria-hidden className="border-border border-b" />

      <Tabs
        variant="secondary"
        selectedKey={String(selectedYear)}
        onSelectionChange={(key) => {
          setSelectedYear(Number(key));
        }}
        className="w-full gap-0"
      >
        <Tabs.ListContainer className="border-border overflow-x-auto border-b px-4 sm:px-8">
          <Tabs.List aria-label={t('versionsAriaLabel')} className="!w-auto max-w-full !border-b-0">
            {versions.map((version) => (
              <Tabs.Tab
                key={version.year}
                id={String(version.year)}
                className="!h-auto !w-auto shrink-0 pb-4"
              >
                <span className="text-base font-medium whitespace-nowrap">{version.year}</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        {versions.map((version) => (
          <Tabs.Panel key={version.year} id={String(version.year)} className="!mt-0 p-4 sm:p-8">
            {version.year === selected.year ? (
              <div className="flex flex-col gap-6">
                {!version.current ? (
                  <div className="border-border bg-muted/5 text-muted flex items-start gap-2 rounded-xl border border-dashed p-3 text-sm">
                    <Clock size={16} className="mt-0.5 shrink-0" aria-hidden />
                    <span>{t('archivedNote')}</span>
                  </div>
                ) : null}
                {onExport ? (
                  <Button variant="outline" size="sm" className="w-fit gap-2" onPress={onExport}>
                    <DownloadSimple size={16} weight="bold" aria-hidden />
                    {t('exportHtml')}
                  </Button>
                ) : null}
                <PolicyDocumentBody site={site} />
              </div>
            ) : null}
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}
