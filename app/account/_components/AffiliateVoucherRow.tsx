'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button, InputGroup, Trash } from '@/components/ui';

export type AffiliateVoucherMetaItem = {
  key: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
};

function MetaCell({ item, className }: { item: AffiliateVoucherMetaItem; className?: string }) {
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

export function AffiliateVoucherRow({
  id,
  code,
  meta,
  onDelete,
  isDeleting,
}: {
  id: string;
  code: string;
  meta: readonly AffiliateVoucherMetaItem[];
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const t = useTranslations('account.affiliate.vouchers');
  const inputId = `affiliate-voucher-${id}`;

  return (
    <article className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <label className="text-foreground sr-only" htmlFor={inputId}>
          {t('codeLabel')}
        </label>
        <div className="min-w-0 flex-1 cursor-not-allowed">
          <InputGroup
            variant="secondary"
            fullWidth
            className="pointer-events-none min-w-0 select-none"
            aria-label={code}
          >
            <InputGroup.Input
              id={inputId}
              value={code}
              readOnly
              tabIndex={-1}
              aria-readonly
              className="font-mono"
            />
          </InputGroup>
        </div>
        <div className="flex shrink-0 flex-nowrap items-center gap-2">
          {onDelete ? (
            <Button
              variant="outline"
              size="sm"
              isIconOnly
              className="size-8 shrink-0 rounded-full"
              aria-label={t('voucherDelete')}
              isDisabled={isDeleting}
              onPress={onDelete}
            >
              <Trash size={16} weight="bold" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {meta.map((item) => (
          <MetaCell
            key={item.key}
            item={item}
            className="flex min-w-0 items-center gap-2 text-sm"
          />
        ))}
      </dl>
    </article>
  );
}
