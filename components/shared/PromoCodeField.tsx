'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'motion/react';
import { Button, Input, X } from '@/components/ui';
import { cn } from '@/lib/utils';

type PromoCodeFieldProps = {
  value: string;
  appliedCode?: string | null;
  error?: string | null;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function PromoCodeField({
  value,
  appliedCode,
  error,
  onChange,
  onApply,
  onRemove,
  disabled = false,
}: PromoCodeFieldProps) {
  const t = useTranslations('account.euRepCheckout.promoCode');
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const open = expanded;

  useLayoutEffect(() => {
    if (!open || appliedCode) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [open, appliedCode]);

  useLayoutEffect(() => {
    const node = panelRef.current;
    if (!node) return;

    const updateHeight = () => {
      setPanelHeight(open ? node.scrollHeight : 0);
    };

    updateHeight();

    if (!open) return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [open, appliedCode, error, value]);

  return (
    <div className="flex flex-col gap-2 overflow-visible">
      <button
        type="button"
        className="text-accent hover:text-key-700 inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium underline decoration-dotted underline-offset-2 transition-colors"
        onClick={() => {
          if (appliedCode) {
            onRemove();
            setExpanded(false);
            return;
          }
          setExpanded((current) => !current);
        }}
      >
        {appliedCode ? <X size={14} weight="bold" aria-hidden /> : null}
        {appliedCode ? t('remove') : open ? t('hideLink') : t('enterLink')}
      </button>

      <div
        className={cn(
          '-mx-3 overflow-visible transition-[height,opacity] ease-out motion-reduce:transition-none',
          reduceMotion ? 'duration-0' : 'duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        style={{ height: panelHeight }}
        aria-hidden={!open && panelHeight === 0}
      >
        <div
          ref={panelRef}
          className="flex flex-col gap-2 overflow-visible rounded-2xl bg-white p-3 [box-shadow:var(--shadow-soft-panel)]"
        >
          <div className="flex items-start gap-2">
            <Input
              ref={inputRef}
              variant="secondary"
              fullWidth
              value={appliedCode ?? value}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              aria-invalid={Boolean(error)}
              disabled={disabled || Boolean(appliedCode)}
              onChange={(event) => {
                onChange(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !appliedCode && value.trim()) {
                  event.preventDefault();
                  onApply();
                }
              }}
            />
            <Button
              variant="outline"
              className="shrink-0"
              onPress={onApply}
              isDisabled={disabled || Boolean(appliedCode) || !value.trim()}
            >
              {appliedCode ? t('applied') : t('apply')}
            </Button>
          </div>
          {error ? <p className="text-danger text-xs">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
