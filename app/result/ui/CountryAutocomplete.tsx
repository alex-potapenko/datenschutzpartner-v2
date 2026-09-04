'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { Collection, ComboBox, Input, ListBox } from '@/components/ui';
import { listCountries, type CountryOption } from '@/lib/countries';

interface CountryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CountryAutocomplete({ value, onChange, placeholder }: CountryAutocompleteProps) {
  const locale = useLocale();
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
      items={countries}
      inputValue={value}
      onInputChange={onChange}
      // HeroUI ComboBox still exposes these keys; the RAC replacements are not wired in this version.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      selectedKey={selectedKey}
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      onSelectionChange={(key) => {
        if (key == null) return;
        const country = countries.find((item) => item.code === String(key));
        if (country) onChange(country.name);
      }}
      defaultFilter={(text, inputValue) => {
        if (!inputValue.trim()) return false;
        const query = inputValue.toLocaleLowerCase();
        return text.toLocaleLowerCase().includes(query);
      }}
    >
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
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
