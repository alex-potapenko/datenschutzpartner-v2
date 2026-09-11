'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MagnifyingGlass, Spinner } from '@/components/ui';
import { useUidCompanySearch, type UidCompany } from '@/api/uid-registry';
import { TextInput } from './FormSection';

interface UidCompanyLookupProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (company: UidCompany) => void;
  placeholder?: string;
  onFocus?: () => void;
  'aria-invalid'?: boolean;
}

export function UidCompanyLookup({
  id,
  value,
  onValueChange,
  onSelect,
  placeholder,
  onFocus,
  'aria-invalid': ariaInvalid,
}: UidCompanyLookupProps) {
  const t = useTranslations('result.questionnaireStep.uidLookup');
  const [isOpen, setIsOpen] = useState(false);
  const search = useUidCompanySearch(value);
  const results = search.data ?? [];
  const query = value.trim();
  const canSearch = query.length >= 2;
  const hasFetched = search.data !== undefined;
  const showResults = isOpen && canSearch && hasFetched && !search.isFetching && results.length > 0;
  const showEmpty = isOpen && canSearch && hasFetched && !search.isFetching && results.length === 0;

  function selectCompany(company: UidCompany) {
    onSelect(company);
    onValueChange(company.name);
    setIsOpen(false);
    requestAnimationFrame(() => {
      const input = id ? document.getElementById(id) : null;
      if (input instanceof HTMLInputElement) {
        input.focus({ preventScroll: true });
      }
    });
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="relative">
        <TextInput
          id={id}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsOpen(false);
          }}
          placeholder={placeholder ?? t('placeholder')}
          className="pr-10"
          autoComplete="off"
          aria-invalid={ariaInvalid}
        />
        <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
          {search.isFetching ? (
            <Spinner aria-label={t('searching')} size="sm" />
          ) : (
            <MagnifyingGlass size={18} aria-hidden />
          )}
        </span>
      </div>

      {showResults ? (
        <ul
          id={`${id ?? 'uid'}-results`}
          className="border-border bg-background absolute top-full z-10 mt-1 flex w-full flex-col overflow-hidden rounded-lg border shadow-sm"
          role="listbox"
          aria-label={t('resultsLabel')}
        >
          {results.map((company) => (
            <li key={company.uid}>
              <button
                type="button"
                tabIndex={-1}
                role="option"
                aria-selected="false"
                className="hover:bg-surface flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectCompany(company);
                }}
              >
                <span className="text-foreground text-sm font-medium">{company.name}</span>
                <span className="text-muted text-xs">
                  {company.uid} · {company.street}, {company.postalCode} {company.city}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showEmpty ? <p className="text-muted text-xs">{t('empty')}</p> : null}
    </div>
  );
}
