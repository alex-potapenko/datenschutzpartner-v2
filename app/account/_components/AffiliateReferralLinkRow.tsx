'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button, InputGroup, Trash } from '@/components/ui';
import { AffiliateReferralCopyButton } from './AffiliateReferralCopyButton';

type AffiliateReferralLinkRowProps = {
  id: string;
  label: string;
  url: string;
  meta: { label: string; value: ReactNode }[];
  onDelete?: () => void;
  isDeleting?: boolean;
};

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, '');
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
          <InputGroup variant="secondary" fullWidth className="min-w-0 flex-1">
            <InputGroup.Input id={inputId} value={displayUrl(url)} readOnly />
          </InputGroup>
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

      <dl className="text-muted flex min-w-0 flex-wrap gap-x-6 gap-y-1 text-sm">
        {meta.map((item) => (
          <div key={item.label} className="flex gap-1.5">
            <dt className="font-medium">{item.label}</dt>
            <dd className="text-foreground tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
