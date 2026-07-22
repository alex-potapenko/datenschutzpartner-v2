'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button, Check, Copy } from '@/components/ui';
import { cn } from '@/lib/utils';
import { resolveDocumentSite, type GeneratedDocument } from '@/api/documents';

function hostedPolicyUrl(document: GeneratedDocument): string {
  const site = resolveDocumentSite(document);
  return `https://policies.datenschutzpartner.ch/${document.id}/${site}`;
}

function buildEmbedCode(document: GeneratedDocument): string {
  const src = hostedPolicyUrl(document);
  return `<iframe\n  src="${src}"\n  title="${document.name}"\n  width="100%"\n  height="800"\n  loading="lazy"\n  style="border:0;max-width:100%;"\n></iframe>`;
}

interface PolicyImplementationGuideProps {
  document: GeneratedDocument;
  className?: string;
}

/** Post-purchase guidance: how to embed the hosted policy on the customer's site. */
export function PolicyImplementationGuide({ document, className }: PolicyImplementationGuideProps) {
  const t = useTranslations('policyDocument.implementation');
  const [copied, setCopied] = useState<'url' | 'embed' | null>(null);
  const hostedUrl = hostedPolicyUrl(document);
  const embedCode = buildEmbedCode(document);

  async function copy(value: string, kind: 'url' | 'embed') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(t('copied'));
      window.setTimeout(() => {
        setCopied(null);
      }, 2000);
    } catch {
      toast.error(t('copyFailed'));
    }
  }

  return (
    <section
      className={cn('px-4 sm:px-8', className)}
      aria-labelledby="policy-implementation-title"
    >
      <div className="border-border bg-surface flex flex-col gap-6 rounded-2xl border p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 id="policy-implementation-title" className="text-foreground text-lg font-semibold">
            {t('title')}
          </h2>
          <p className="text-muted text-sm leading-relaxed">{t('body')}</p>
        </div>

        <ol className="text-foreground flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed">
          <li>{t('steps.hosted')}</li>
          <li>{t('steps.link')}</li>
          <li>{t('steps.embed')}</li>
        </ol>

        <div className="flex flex-col gap-3">
          <span className="text-muted text-xs font-semibold tracking-wide uppercase">
            {t('hostedUrlLabel')}
          </span>
          <div className="border-border bg-background flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
            <code className="text-foreground min-w-0 flex-1 text-sm break-all">{hostedUrl}</code>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onPress={() => {
                void copy(hostedUrl, 'url');
              }}
            >
              {copied === 'url' ? (
                <Check size={14} weight="bold" aria-hidden />
              ) : (
                <Copy size={14} weight="bold" aria-hidden />
              )}
              {t('copyUrl')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-muted text-xs font-semibold tracking-wide uppercase">
            {t('embedCodeLabel')}
          </span>
          <div className="border-border bg-background flex flex-col gap-3 rounded-xl border p-4">
            <pre className="text-foreground overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
              {embedCode}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="w-fit gap-2"
              onPress={() => {
                void copy(embedCode, 'embed');
              }}
            >
              {copied === 'embed' ? (
                <Check size={14} weight="bold" aria-hidden />
              ) : (
                <Copy size={14} weight="bold" aria-hidden />
              )}
              {t('copyEmbed')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
