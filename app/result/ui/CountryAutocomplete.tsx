'use client';

import { useMemo } from 'react';
import type { Key } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Collection, ComboBox, Input, ListBox } from '@/components/ui';
import { listCountries, type CountryOption } from '@/lib/countries';

interface CountryAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-invalid'?: boolean;
}

export function CountryAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  'aria-invalid': ariaInvalid,
}: CountryAutocompleteProps) {
  const locale = useLocale();
  const t = useTranslations('common');
  const countries = useMemo(() => listCountries(locale), [locale]);

  const selectedKey = useMemo(() => {
    const match = countries.find((country) => country.name === value);
    return match?.code ?? null;
  }, [countries, value]);

  return (
    <ComboBox
      allowsCustomValue={false}
      fullWidth
      variant="secondary"
      menuTrigger="focus"
      inputValue={value}
      onInputChange={onChange}
      value={selectedKey}
      onChange={(key: Key | null) => {
        if (key == null) return;
        const country = countries.find((item) => item.code === String(key));
        if (country) onChange(country.name);
      }}
      defaultFilter={(text, inputValue) => {
        const query = inputValue.trim().toLocaleLowerCase();
        if (!query) return true;
        return text.toLocaleLowerCase().includes(query);
      }}
    >
      <ComboBox.InputGroup data-invalid={ariaInvalid || undefined}>
        <Input id={id} placeholder={placeholder ?? t('search')} aria-invalid={ariaInvalid} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          <Collection items={countries}>
            {(country: CountryOption) => (
              <ListBox.Item id={country.code} textValue={`${country.name} ${country.code}`}>
                {country.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </Collection>
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
