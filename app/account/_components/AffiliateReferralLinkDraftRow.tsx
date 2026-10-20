'use client';

import { useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/api/client';
import { affiliateReferralLinkCreateSchema, useCreateAffiliateReferralLink } from '@/api/affiliate';
import { FieldErrorText } from '@/components/shared/FieldErrorText';
import { AFFILIATE_DRAFT_ROW_INSET_CLASS } from './account-ui';
import { Button, Check, Input, InputGroup, Label, X, cn } from '@/components/ui';
import { AFFILIATE_REF_PUBLIC_HOST } from '@/lib/affiliate-attribution';

const DRAFT_TARGET_PREFIX = `${AFFILIATE_REF_PUBLIC_HOST}/`;

export function AffiliateReferralLinkDraftRow({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('account.affiliate.links');
  const tRoot = useTranslations();
  const createLink = useCreateAffiliateReferralLink();
  const [targetPath, setTargetPath] = useState('');
  const [campaign, setCampaign] = useState('');
  const [errorKey, setErrorKey] = useState<string | undefined>();

  function save() {
    const suffix = targetPath.trim().replace(/^\/+/, '');
    const fullTarget = suffix ? `${DRAFT_TARGET_PREFIX}${suffix}` : DRAFT_TARGET_PREFIX;
    const parsed = affiliateReferralLinkCreateSchema.safeParse({
      targetPath: fullTarget,
      campaign: campaign.trim() || undefined,
    });
    if (!parsed.success) {
      setErrorKey(parsed.error.issues[0]?.message ?? 'validation.affiliateTargetPath');
      return;
    }
    setErrorKey(undefined);
    createLink.mutate(parsed.data, {
      onSuccess: () => {
        onSaved();
      },
      onError: (cause) => {
        if (cause instanceof ApiError && cause.status === 409) {
          setErrorKey('account.affiliate.links.linkExists');
          return;
        }
        if (cause instanceof ApiError && cause.status === 400) {
          setErrorKey('validation.affiliateTargetPath');
          return;
        }
        setErrorKey('account.affiliate.links.createFailed' as const);
      },
    });
  }

  const inputId = 'affiliate-link-draft-target';
  const campaignId = 'affiliate-link-draft-campaign';
  const invalid = Boolean(errorKey);

  function onFieldKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    }
    if (event.key === 'Escape') {
      onCancel();
    }
  }

  return (
    <article
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-b-lg p-4 sm:p-5',
        AFFILIATE_DRAFT_ROW_INSET_CLASS
      )}
    >
      <p className="text-foreground m-0 text-sm leading-relaxed">{t('createHint')}</p>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-row flex-nowrap items-end gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor={inputId} isInvalid={invalid}>
              {t('targetLabel')}
            </Label>
            <InputGroup
              variant="secondary"
              fullWidth
              className="min-w-0"
              data-invalid={invalid || undefined}
            >
              <InputGroup.Prefix className="text-muted shrink-0 pr-0 text-sm whitespace-nowrap select-none">
                {DRAFT_TARGET_PREFIX}
              </InputGroup.Prefix>
              <InputGroup.Input
                id={inputId}
                value={targetPath}
                onChange={(event) => {
                  setTargetPath(event.target.value);
                  setErrorKey(undefined);
                }}
                onKeyDown={onFieldKeyDown}
                inputMode="url"
                spellCheck={false}
                aria-invalid={invalid}
              />
            </InputGroup>
          </div>
          <div className="flex w-[200px] min-w-0 shrink-0 flex-col gap-1.5">
            <Label htmlFor={campaignId} isInvalid={invalid}>
              {t('campaignLabel')}
            </Label>
            <Input
              id={campaignId}
              variant="secondary"
              fullWidth
              value={campaign}
              onChange={(event) => {
                setCampaign(event.target.value);
                setErrorKey(undefined);
              }}
              onKeyDown={onFieldKeyDown}
              placeholder={t('campaignPlaceholder')}
              spellCheck={false}
              aria-invalid={invalid}
            />
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-2 pb-0.5">
            <Button
              type="button"
              variant="primary"
              size="sm"
              isIconOnly
              className="size-8 shrink-0 rounded-full"
              aria-label={t('saveLink')}
              isDisabled={createLink.isPending}
              onPress={save}
            >
              <Check size={16} weight="bold" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isIconOnly
              className="size-8 shrink-0 rounded-full"
              aria-label={t('cancelCreate')}
              isDisabled={createLink.isPending}
              onPress={onCancel}
            >
              <X size={16} weight="bold" aria-hidden />
            </Button>
          </div>
        </div>
        <FieldErrorText message={errorKey ? tRoot(errorKey) : undefined} />
      </div>
    </article>
  );
}
