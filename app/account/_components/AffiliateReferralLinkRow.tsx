'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AFFILIATE_SLUG_PATTERN,
  type AffiliateReferralLink,
  useDeleteAffiliateReferralLink,
  useUpdateAffiliateReferralLinkPath,
} from '@/api/affiliate';
import { AFFILIATE_REF_URL_PREFIX, affiliateReferralUrl } from '@/lib/affiliate-attribution';
import { FieldErrorText } from '@/components/shared/FieldErrorText';
import { Button, InputGroup, Trash } from '@/components/ui';
import { AffiliateReferralCopyButton } from './AffiliateReferralCopyButton';

type AffiliateReferralLinkRowProps = {
  link: AffiliateReferralLink;
};

export function AffiliateReferralLinkRow({ link }: AffiliateReferralLinkRowProps) {
  const t = useTranslations('account.affiliate.dashboard');
  const format = useFormatter();
  const updatePath = useUpdateAffiliateReferralLinkPath();
  const deleteLink = useDeleteAffiliateReferralLink();
  const [pathDraft, setPathDraft] = useState('');
  const [pathError, setPathError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const pathSegment = pathDraft || link.pathSegment;
  const pathDirty = pathSegment.trim() !== link.pathSegment;

  const createdLabel = format.dateTime(new Date(link.createdAt), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  function commitPathSegmentOnBlur() {
    const next = pathSegment.trim();
    if (next === link.pathSegment) {
      setPathDraft('');
      setPathError(null);
      return;
    }
    if (!AFFILIATE_SLUG_PATTERN.test(next)) {
      setPathError(t('pathSegmentInvalid'));
      setPathDraft('');
      return;
    }
    void updatePath
      .mutateAsync({ id: link.id, pathSegment: next })
      .then(() => {
        setPathDraft('');
        setPathError(null);
      })
      .catch(() => {
        setPathError(t('pathSegmentTaken'));
        setPathDraft('');
      });
  }

  async function copyReferralLink(url: string) {
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
        <label className="text-foreground sr-only" htmlFor={`affiliate-link-${link.id}`}>
          {t('linkFieldLabel')}
        </label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <InputGroup
            variant="secondary"
            fullWidth
            className="min-w-0 flex-1"
            data-invalid={Boolean(pathError) || undefined}
          >
            <InputGroup.Prefix className="text-muted max-w-[45%] truncate text-sm select-none sm:max-w-none sm:whitespace-nowrap">
              {AFFILIATE_REF_URL_PREFIX}
            </InputGroup.Prefix>
            <InputGroup.Input
              id={`affiliate-link-${link.id}`}
              value={pathSegment}
              onChange={(event) => {
                setPathDraft(event.target.value);
                setPathError(null);
              }}
              onBlur={() => {
                commitPathSegmentOnBlur();
              }}
              aria-invalid={Boolean(pathError)}
              disabled={updatePath.isPending}
            />
          </InputGroup>
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <AffiliateReferralCopyButton
              copied={linkCopied}
              copyLabel={t('copyLink')}
              copiedLabel={t('linkCopied')}
              onCopy={() => {
                const url = pathDirty ? affiliateReferralUrl(pathSegment.trim()) : link.referralUrl;
                void copyReferralLink(url);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              isIconOnly
              className="size-8 shrink-0 rounded-full"
              aria-label={t('linkDelete')}
              isDisabled={deleteLink.isPending}
              onPress={() => {
                void deleteLink.mutateAsync(link.id).catch(() => {
                  toast.error(t('linkDeleteFailed'));
                });
              }}
            >
              <Trash size={16} weight="bold" aria-hidden />
            </Button>
          </div>
        </div>
        <FieldErrorText message={pathError ?? undefined} />
      </div>

      <dl className="text-muted flex min-w-0 flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="font-medium">{t('linkCreated')}</dt>
          <dd className="text-foreground">{createdLabel}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium">{t('stats.clicks')}</dt>
          <dd className="text-foreground tabular-nums">{link.clicks}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium">{t('stats.conversions')}</dt>
          <dd className="text-foreground tabular-nums">{link.conversions}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium">{t('stats.balance')}</dt>
          <dd className="text-foreground tabular-nums">{link.balanceChf.toFixed(2)}</dd>
        </div>
      </dl>
    </article>
  );
}
