'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { translateDpoDesignation, type DpoDesignationLocale } from '@/lib/dpo-designation';
import { NavigationLink } from '@/components/shared/NavigationLink';
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
        <div
          className="flex flex-wrap items-center gap-2 pl-3"
          role="group"
          aria-label={t('groupAria')}
        >
          {(['de', 'en'] as const).map((locale) => {
            const isActive = activeLocale === locale;
            const localeLabel = t(locale);

            if (isActive) {
              return (
                <span
                  key={locale}
                  aria-current="true"
                  className="bg-key-100 text-foreground -mx-1 inline-flex items-center rounded-full px-1 text-xs font-medium"
                >
                  {localeLabel}
                </span>
              );
            }

            return (
              <NavigationLink
                key={locale}
                chevron="none"
                size="xs"
                onPress={() => {
                  handleLocaleChange(locale);
                }}
                className="text-muted hover:text-foreground font-medium underline decoration-[var(--muted)] decoration-dotted underline-offset-[3px] hover:decoration-[var(--foreground)]"
              >
                {localeLabel}
              </NavigationLink>
            );
          })}
        </div>
      </div>
    </Field>
  );
}
