'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MagnifyingGlass, Spinner } from '@/components/ui';
import { useUidCompanySearch, type UidCompany } from '@/api/uid-registry';
import { TextInput } from '../ui/FormSection';

interface UidCompanyLookupProps {
  onSelect: (company: UidCompany) => void;
}

export function UidCompanyLookup({ onSelect }: UidCompanyLookupProps) {
  const t = useTranslations('result.improvedStep.uidLookup');
  const [query, setQuery] = useState('');
  const search = useUidCompanySearch(query);
  const results = search.data ?? [];
  const showResults = query.trim().length >= 2 && !search.isLoading && results.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <TextInput
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={t('placeholder')}
          className="pr-10"
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
          className="border-border divide-border flex flex-col divide-y overflow-hidden rounded-xl border"
          role="listbox"
          aria-label={t('resultsLabel')}
        >
          {results.map((company) => (
            <li key={company.uid}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                className="hover:bg-surface flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors"
                onClick={() => {
                  onSelect(company);
                  setQuery(company.uid);
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

      {query.trim().length >= 2 && !search.isLoading && results.length === 0 ? (
        <p className="text-muted text-xs">{t('empty')}</p>
      ) : null}
    </div>
  );
}
