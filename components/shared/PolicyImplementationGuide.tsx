'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  buildHostedPolicyPath,
  buildHostedPolicyUrl,
  resolveDocumentSite,
  type GeneratedDocument,
} from '@/api/documents';
import { ArrowSquareOut, Tabs } from '@/components/ui';
import { CopyClipboardButton } from '@/components/shared/CopyClipboardButton';
import { cn } from '@/lib/utils';

type InstallTab = 'embed' | 'url';

function buildIframeEmbedCode(document: GeneratedDocument, hostedUrl: string): string {
  return `<iframe\n  src="${hostedUrl}"\n  title="${document.name}"\n  width="100%"\n  height="800"\n  loading="lazy"\n  style="border:0;max-width:100%;"\n></iframe>`;
}

function buildScriptEmbedCode(document: GeneratedDocument, hostedUrl: string): string {
  const origin = new URL(hostedUrl).origin;
  const site = resolveDocumentSite(document);
  return `<script\n  src="${origin}/embed.js"\n  data-policy-id="${document.id}"\n  data-site="${site}"\n  data-hosted-url="${hostedUrl}"\n  async\n></script>`;
}

function CopyCodeBlock({
  label,
  description,
  value,
  copyLabel,
  copyErrorMessage,
}: {
  label: string;
  description: string;
  value: string;
  copyLabel: string;
  copyErrorMessage: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <p className="text-foreground text-sm leading-relaxed">{description}</p>
      </div>
      <div className="border-border bg-background flex flex-col gap-3 rounded-xl border p-4">
        <pre className="text-foreground overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
          {value}
        </pre>
        <CopyClipboardButton
          copyLabel={copyLabel}
          copyErrorMessage={copyErrorMessage}
          onCopy={async () => {
            await navigator.clipboard.writeText(value);
          }}
        />
      </div>
    </div>
  );
}

interface PolicyImplementationGuideProps {
  document: GeneratedDocument;
  className?: string;
}

/** Post-purchase guidance: embed the hosted policy on the customer's site (iframe or script). */
export function PolicyImplementationGuide({ document, className }: PolicyImplementationGuideProps) {
  const t = useTranslations('policyDocument.implementation');
  const [activeTab, setActiveTab] = useState<InstallTab>('embed');
  const hostedPath = buildHostedPolicyPath(document);
  const hostedUrl = buildHostedPolicyUrl(document);
  const iframeEmbedCode = buildIframeEmbedCode(document, hostedUrl);
  const scriptEmbedCode = buildScriptEmbedCode(document, hostedUrl);

  return (
    <section className={cn('flex flex-col gap-6 px-8 py-8 sm:py-10', className)}>
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(String(key) as InstallTab);
        }}
        className="gap-6"
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label={t('tabsAriaLabel')} className="!w-auto max-w-full">
            <Tabs.Tab id="embed" className="!h-auto !w-auto shrink-0">
              <span className="text-base font-medium whitespace-nowrap">{t('tabs.embed')}</span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="url" className="!h-auto !w-auto shrink-0">
              <span className="text-base font-medium whitespace-nowrap">{t('tabs.url')}</span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="embed" className="!mt-0 flex flex-col gap-6 !p-0">
          <CopyCodeBlock
            label={t('iframeEmbedLabel')}
            description={t('steps.embedIframe')}
            value={iframeEmbedCode}
            copyLabel={t('copy')}
            copyErrorMessage={t('copyFailed')}
          />

          <CopyCodeBlock
            label={t('javascriptEmbedLabel')}
            description={t('steps.embedScript')}
            value={scriptEmbedCode}
            copyLabel={t('copy')}
            copyErrorMessage={t('copyFailed')}
          />
        </Tabs.Panel>

        <Tabs.Panel id="url" className="!mt-0 flex flex-col gap-6 !p-0">
          <p className="text-foreground text-sm leading-relaxed">{t('alternativeBody')}</p>

          <div className="flex flex-col gap-3">
            <span className="text-foreground text-sm font-medium">{t('hostedUrlLabel')}</span>
            <div className="border-border bg-background flex flex-col gap-3 rounded-xl border p-4">
              <code className="text-foreground min-w-0 text-sm break-all">{hostedUrl}</code>
              <div className="flex flex-wrap items-center gap-2">
                <CopyClipboardButton
                  copyLabel={t('copy')}
                  copyErrorMessage={t('copyFailed')}
                  onCopy={async () => {
                    await navigator.clipboard.writeText(hostedUrl);
                  }}
                />
                <a
                  href={hostedPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display border-border text-accent hover:border-accent/50 hover:bg-accent/5 inline-flex h-8 items-center justify-center gap-2 rounded-full border px-3 text-sm font-bold no-underline transition-colors"
                >
                  {t('open')}
                  <ArrowSquareOut size={14} weight="bold" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </Tabs.Panel>
      </Tabs>
    </section>
  );
}
