'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalRoot,
  SearchField,
  Spinner,
  useOverlayState,
} from '@/components/ui';
import { useUidCompanySearch, type UidCompany } from '@/api/uid-registry';
import { TextInput } from './FormSection';

const MIN_QUERY_LENGTH = 2;

interface UidCompanyLookupProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (company: UidCompany) => void;
  onFocus?: () => void;
  'aria-invalid'?: boolean;
}

/** Legal entity name — click the field to open UID register modal (Add service pattern); Tab-focus allows typing. */
export function UidCompanyLookup({
  id,
  value,
  onValueChange,
  onSelect,
  onFocus,
  'aria-invalid': ariaInvalid,
}: UidCompanyLookupProps) {
  const dialog = useOverlayState();
  const [query, setQuery] = useState('');

  function openSearch() {
    setQuery(value);
    dialog.open();
  }

  function selectCompany(company: UidCompany) {
    onSelect(company);
    onValueChange(company.name);
    dialog.close();
  }

  return (
    <>
      <TextInput
        id={id}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        onClick={() => {
          openSearch();
        }}
        onFocus={onFocus}
        className="cursor-pointer"
        autoComplete="off"
        aria-invalid={ariaInvalid}
        aria-haspopup="dialog"
      />

      <UidCompanySearchDialog
        state={dialog}
        query={query}
        onQueryChange={setQuery}
        onSelect={selectCompany}
      />
    </>
  );
}

function UidCompanySearchDialog({
  state,
  query,
  onQueryChange,
  onSelect,
}: {
  state: ReturnType<typeof useOverlayState>;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (company: UidCompany) => void;
}) {
  const t = useTranslations('result.questionnaireStep.uidLookup');
  const tCommon = useTranslations('common');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const search = useUidCompanySearch(query);
  const results = search.data ?? [];
  const canSearch = query.trim().length >= MIN_QUERY_LENGTH;

  const isLoading = canSearch && search.isFetching;
  const status = !canSearch
    ? t('minChars')
    : !isLoading && results.length === 0
      ? t('empty')
      : null;

  useLayoutEffect(() => {
    if (!state.isOpen) return;
    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [state.isOpen]);

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('dialogTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-5">
                <p className="text-foreground text-sm leading-relaxed">{t('hint')}</p>

                <div className="border-border flex h-[340px] flex-col overflow-hidden rounded-xl border">
                  <div className="border-border shrink-0 border-b p-3">
                    <SearchField
                      aria-label={t('label')}
                      value={query}
                      onChange={onQueryChange}
                      variant="secondary"
                      fullWidth
                    >
                      <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input ref={searchInputRef} placeholder={t('placeholder')} />
                        <SearchField.ClearButton />
                      </SearchField.Group>
                    </SearchField>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-1 items-center justify-center">
                      <Spinner aria-label={t('searching')} size="sm" />
                    </div>
                  ) : status ? (
                    <p className="text-muted flex flex-1 items-center justify-center px-4 text-center text-sm leading-relaxed">
                      {status}
                    </p>
                  ) : (
                    <ul
                      aria-label={t('resultsLabel')}
                      className="divide-border flex min-h-0 flex-1 flex-col divide-y overflow-y-auto"
                    >
                      {results.map((company) => (
                        <li
                          key={company.uid}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="text-foreground text-sm font-medium">
                              {company.name}
                            </span>
                            <span className="text-muted text-xs">
                              {company.uid} · {company.street}, {company.postalCode} {company.city}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            aria-label={t('selectCompany', { name: company.name })}
                            onPress={() => {
                              onSelect(company);
                            }}
                          >
                            {t('select')}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  state.close();
                }}
              >
                {tCommon('cancel')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
