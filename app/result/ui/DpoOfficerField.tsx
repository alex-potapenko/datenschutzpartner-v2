'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { translateDpoDesignation, type DpoDesignationLocale } from '@/lib/dpo-designation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Field, TextInput } from './FormSection';

type DpoOfficerFieldProps = {
  id?: string;
  label: string;
  description?: string;
  optionalBadge?: string;
  valueEn: string;
  valueDe: string;
  onValueEnChange: (value: string) => void;
  onValueDeChange: (value: string) => void;
};

export function DpoOfficerField({
  id,
  label,
  description,
  optionalBadge,
  valueEn,
  valueDe,
  onValueEnChange,
  onValueDeChange,
}: DpoOfficerFieldProps) {
  const uiLocale = useLocale();
  const t = useTranslations('result.questionnaireStep.officerLocaleLabels');
  const [activeLocale, setActiveLocale] = useState<DpoDesignationLocale>(
    uiLocale === 'de' ? 'de' : 'en'
  );

  const activeValue = activeLocale === 'en' ? valueEn : valueDe;

  function handleLocaleChange(nextLocale: DpoDesignationLocale) {
    if (nextLocale === activeLocale) return;

    const sourceValue = activeLocale === 'en' ? valueEn : valueDe;
    const targetValue = nextLocale === 'en' ? valueEn : valueDe;

    if (!targetValue.trim() && sourceValue.trim()) {
      const translated = translateDpoDesignation(sourceValue, nextLocale);
      if (translated) {
        if (nextLocale === 'en') {
          onValueEnChange(translated);
        } else {
          onValueDeChange(translated);
        }
      }
    }

    setActiveLocale(nextLocale);
  }

  return (
    <Field label={label} description={description}>
      <div className="flex flex-col gap-1.5">
        <TextInput
          id={id}
          value={activeValue}
          optionalLabel={optionalBadge}
          onChange={(event) => {
            const next = event.target.value;
            if (activeLocale === 'en') {
              onValueEnChange(next);
            } else {
              onValueDeChange(next);
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {(['de', 'en'] as const).map((locale) => {
            const isActive = activeLocale === locale;

            return (
              <Button
                key={locale}
                type="button"
                size="md"
                variant="outline"
                aria-pressed={isActive}
                className={cn(
                  'h-auto min-h-0 rounded-full border-0 px-2 py-0.5 font-sans text-sm font-medium',
                  isActive
                    ? 'bg-key-100 text-foreground [box-shadow:inset_0_0_0_1.5px_var(--key-500)]'
                    : '[box-shadow:inset_0_0_0_1.5px_var(--border)]'
                )}
                onPress={() => {
                  handleLocaleChange(locale);
                }}
              >
                {t(locale)}
              </Button>
            );
          })}
        </div>
      </div>
    </Field>
  );
}
