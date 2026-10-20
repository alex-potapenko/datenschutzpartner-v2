'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useProfile } from '@/api/account';
import { ApiError } from '@/api/client';
import { affiliateVoucherExampleCode } from '@/lib/affiliate-voucher-example';
import {
  affiliateVoucherCreateSchema,
  useAffiliateProgramSettings,
  useCreateAffiliateVoucher,
} from '@/api/affiliate';
import { FieldErrorText } from '@/components/shared/FieldErrorText';
import { AFFILIATE_DRAFT_ROW_INSET_CLASS } from './account-ui';
import { Button, Check, Input, InputGroup, Label, X, cn } from '@/components/ui';

export function AffiliateVoucherDraftRow({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('account.affiliate.vouchers');
  const tRoot = useTranslations();
  const profile = useProfile();
  const settings = useAffiliateProgramSettings();
  const createVoucher = useCreateAffiliateVoucher();
  const maxPercent = settings.data?.maxVoucherDiscountPercent ?? 20;
  const exampleCode = useMemo(
    () => affiliateVoucherExampleCode(profile.data?.firstName, maxPercent),
    [maxPercent, profile.data?.firstName]
  );
  const [code, setCode] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [errorKey, setErrorKey] = useState<string | undefined>();

  function save() {
    if (discountInput.trim() === '') {
      setErrorKey('validation.required');
      return;
    }
    const discountPercent = Number(discountInput);
    const parsed = affiliateVoucherCreateSchema.safeParse({ code, discountPercent });
    if (!parsed.success) {
      setErrorKey(parsed.error.issues[0]?.message ?? 'validation.required');
      return;
    }
    if (parsed.data.discountPercent > maxPercent) {
      setErrorKey('account.affiliate.vouchers.discountTooHigh');
      return;
    }
    setErrorKey(undefined);
    createVoucher.mutate(parsed.data, {
      onSuccess: () => {
        onSaved();
      },
      onError: (cause) => {
        if (cause instanceof ApiError && cause.status === 409) {
          setErrorKey('account.affiliate.vouchers.codeTaken');
          return;
        }
        setErrorKey('account.affiliate.vouchers.createFailed');
      },
    });
  }

  const codeId = 'affiliate-voucher-draft-code';
  const discountId = 'affiliate-voucher-draft-discount';
  const invalid = Boolean(errorKey);

  return (
    <article
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-b-lg p-4 sm:p-5',
        AFFILIATE_DRAFT_ROW_INSET_CLASS
      )}
    >
      <p className="text-foreground m-0 text-sm leading-relaxed">
        {t('draftHint', { maxPercent })} <span className="font-mono">{exampleCode}</span>
      </p>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-row flex-nowrap items-end gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor={codeId} isInvalid={invalid}>
              {t('codeLabel')}
            </Label>
            <Input
              id={codeId}
              variant="secondary"
              fullWidth
              className="min-w-0 font-mono"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setErrorKey(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  save();
                }
                if (event.key === 'Escape') {
                  onCancel();
                }
              }}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={invalid}
            />
          </div>
          <div className="flex w-20 shrink-0 flex-col gap-1.5">
            <Label htmlFor={discountId} isInvalid={invalid}>
              {t('discountLabel')}
            </Label>
            <InputGroup variant="secondary" fullWidth data-invalid={invalid || undefined}>
              <InputGroup.Input
                id={discountId}
                type="number"
                min={1}
                max={maxPercent}
                className="tabular-nums"
                value={discountInput}
                onChange={(event) => {
                  setDiscountInput(event.target.value);
                  setErrorKey(undefined);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    save();
                  }
                  if (event.key === 'Escape') {
                    onCancel();
                  }
                }}
                aria-invalid={invalid}
              />
              <InputGroup.Suffix
                className="text-muted shrink-0 pe-2 text-sm whitespace-nowrap select-none"
                aria-hidden
              >
                %
              </InputGroup.Suffix>
            </InputGroup>
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-2 pb-0.5">
            <Button
              type="button"
              variant="primary"
              size="sm"
              isIconOnly
              className="size-8 shrink-0 rounded-full"
              aria-label={t('saveVoucher')}
              isDisabled={createVoucher.isPending}
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
              isDisabled={createVoucher.isPending}
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
