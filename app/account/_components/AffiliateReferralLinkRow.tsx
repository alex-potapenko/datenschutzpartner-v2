'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button, InputGroup, Trash } from '@/components/ui';
import { splitPartnerReferralLinkDisplay } from '@/lib/affiliate-attribution';
import { AffiliateReferralCopyButton } from './AffiliateReferralCopyButton';

export type AffiliateReferralLinkMetaItem = {
  key: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
};

type AffiliateReferralLinkRowProps = {
  id: string;
  label: string;
  url: string;
  meta: readonly AffiliateReferralLinkMetaItem[];
  onDelete?: () => void;
  isDeleting?: boolean;
};

function MetaCell({
  item,
  className,
}: {
  item: AffiliateReferralLinkMetaItem;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-muted shrink-0 [&_svg]:size-4" aria-hidden>
        {item.icon}
      </span>
      <dt className="text-muted shrink-0 font-normal">{item.label}</dt>
      <dd className="text-foreground min-w-0 truncate tabular-nums">{item.value}</dd>
    </div>
  );
}

export function AffiliateReferralLinkRow({
  id,
  label,
  url,
  meta,
  onDelete,
  isDeleting,
}: AffiliateReferralLinkRowProps) {
  const t = useTranslations('account.affiliate.dashboard');
  const [linkCopied, setLinkCopied] = useState(false);
  const inputId = `affiliate-link-${id}`;
  const linkParts = splitPartnerReferralLinkDisplay(url);
  const displayUrl = url.replace(/^https?:\/\//, '');
  const showStructuredTail = Boolean(
    linkParts.hostPrefix && (linkParts.marketingPage || linkParts.refSuffix)
  );
  const pathAfterHost = linkParts.hostPrefix
    ? displayUrl.slice(linkParts.hostPrefix.length)
    : displayUrl;

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch {
      toast.error(t('copyFailed'));
    }
  }

  return (
    <article className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-2">
        <label className="text-foreground sr-only" htmlFor={inputId}>
          {label}
        </label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 cursor-not-allowed">
            <InputGroup
              variant="secondary"
              fullWidth
              className="pointer-events-none select-none"
              aria-label={displayUrl}
            >
              {linkParts.hostPrefix ? (
                <InputGroup.Prefix className="text-muted shrink-0 pr-0 text-sm whitespace-nowrap select-none">
                  {linkParts.hostPrefix}
                </InputGroup.Prefix>
              ) : null}
              {showStructuredTail ? (
                <div
                  id={inputId}
                  className="text-foreground flex min-w-0 flex-1 items-center overflow-x-auto text-sm whitespace-nowrap select-none"
                >
                  {linkParts.marketingPage ? (
                    <span className="font-medium">{linkParts.marketingPage}</span>
                  ) : null}
                  {linkParts.refSuffix ? (
                    <span className="text-muted shrink-0">{linkParts.refSuffix}</span>
                  ) : null}
                </div>
              ) : (
                <InputGroup.Input
                  id={inputId}
                  value={pathAfterHost || displayUrl}
                  readOnly
                  tabIndex={-1}
                  aria-readonly
                />
              )}
            </InputGroup>
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <AffiliateReferralCopyButton
              copied={linkCopied}
              copyLabel={t('copyLink')}
              copiedLabel={t('linkCopied')}
              copiedTooltip={t('linkCopiedTooltip')}
              onCopy={() => {
                void copyReferralLink();
              }}
            />
            {onDelete ? (
              <Button
                variant="outline"
                size="sm"
                isIconOnly
                className="size-8 shrink-0 rounded-full"
                aria-label={t('linkDelete')}
                isDisabled={isDeleting}
                onPress={onDelete}
              >
                <Trash size={16} weight="bold" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <dl className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-snug">
        {meta.map((item) => (
          <MetaCell
            key={item.key}
            item={item}
            className="flex w-max max-w-full shrink-0 items-center gap-1.5"
          />
        ))}
      </dl>
    </article>
  );
}
