'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Butterfly, Copy, LinkedinLogo, ThreadsLogo } from '@/components/ui';
import { INSIGHT_META_LABEL_CLASS } from './insight-article-layout';

type InsightArticleShareProps = {
  title: string;
  translationNamespace?: 'insights' | 'academy';
};

const shareIconClassName =
  'text-[var(--accent)] hover:text-foreground inline-flex size-6 items-center justify-center transition-colors disabled:opacity-40';

function subscribeToUrl() {
  return () => {};
}

function getPageUrl() {
  return window.location.href;
}

function getServerPageUrl() {
  return '';
}

function buildShareUrl(
  platform: 'linkedin' | 'bluesky' | 'threads',
  pageUrl: string,
  title: string
) {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedText = encodeURIComponent(`${title} ${pageUrl}`);

  switch (platform) {
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'bluesky':
      return `https://bsky.app/intent/compose?text=${encodedText}`;
    case 'threads':
      return `https://www.threads.net/intent/post?text=${encodedText}`;
  }
}

export function InsightArticleShare({
  title,
  translationNamespace = 'insights',
}: InsightArticleShareProps) {
  const t = useTranslations(translationNamespace);
  const [copied, setCopied] = useState(false);
  const pageUrl = useSyncExternalStore(subscribeToUrl, getPageUrl, getServerPageUrl);

  const handleCopyLink = useCallback(async () => {
    if (!pageUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }, [pageUrl]);

  const shareLinks = pageUrl
    ? ([
        {
          id: 'linkedin',
          label: t('shareLinkedIn'),
          href: buildShareUrl('linkedin', pageUrl, title),
          icon: <LinkedinLogo size={24} weight="fill" aria-hidden />,
        },
        {
          id: 'bluesky',
          label: t('shareBluesky'),
          href: buildShareUrl('bluesky', pageUrl, title),
          icon: <Butterfly size={24} weight="fill" aria-hidden />,
        },
        {
          id: 'threads',
          label: t('shareThreads'),
          href: buildShareUrl('threads', pageUrl, title),
          icon: <ThreadsLogo size={24} weight="fill" aria-hidden />,
        },
      ] as const)
    : [];

  return (
    <div className="flex flex-col gap-2">
      <span className={INSIGHT_META_LABEL_CLASS}>{t('share')}</span>
      <div className="flex flex-wrap items-center gap-2.5">
        {shareLinks.map((link) => (
          <a
            key={link.id}
            href={link.href}
            aria-label={link.label}
            className={shareIconClassName}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.icon}
          </a>
        ))}
        <div className="relative inline-flex size-6 items-center justify-center">
          <button
            type="button"
            aria-label={t('copyLink')}
            aria-describedby={copied ? 'copy-link-tooltip' : undefined}
            className={`${shareIconClassName} cursor-pointer`}
            disabled={!pageUrl}
            onClick={handleCopyLink}
          >
            <Copy size={24} aria-hidden />
          </button>
          {copied && (
            <span
              id="copy-link-tooltip"
              role="tooltip"
              className="bg-foreground text-background absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap"
            >
              {t('linkCopiedTooltip')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
