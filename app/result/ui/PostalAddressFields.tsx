'use client';

import { useTranslations } from 'next-intl';
import type { UidCompany } from '@/api/uid-registry';
import { ValidationRequiredBadge } from '@/components/shared/ValidationRequiredBadge';
import { CountryAutocomplete } from './CountryAutocomplete';
import { UidCompanyLookup } from './UidCompanyLookup';
import { Field, TextInput } from './FormSection';

/** Matches half-width fields in a two-column row with gap-6 (e.g. first name). */
const HALF_FIELD_WIDTH_CLASS = 'w-full sm:w-[calc((100%-1.5rem)/2)]';

type PostalAddressFieldsProps = {
  legalEntity?: string;
  onLegalEntityChange?: (value: string) => void;
  onLegalEntityFocus?: () => void;
  onLegalEntityUidSelect?: (company: UidCompany) => void;
  legalEntityError?: string;
  legalEntityRequiredLabel?: string;
  legalEntityRequiredShakeKey?: number;
  uidSearchPlaceholder?: string;
  vatId?: string;
  onVatIdChange?: (value: string) => void;
  vatIdError?: string;
  department?: string;
  onDepartmentChange?: (value: string) => void;
  departmentError?: string;
  street: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  country?: string;
  onCountryChange?: (value: string) => void;
  countryError?: string;
  onStreetChange: (value: string) => void;
  onStreetLine2Change?: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  /** Read-only country label — billing and fixed Swiss addresses. */
  countryDisplayLabel?: string;
  showPostalLines?: boolean;
  showLine2?: boolean;
  showLine1Label?: boolean;
  optionalBadge?: string;
  line1RequiredLabel?: string;
  requiredShakeKey?: number;
  idPrefix?: string;
  line1Error?: string;
  streetError?: string;
  postalCodeError?: string;
  cityError?: string;
  streetLine2Error?: string;
  onAddressFocus?: () => void;
};

/** Structured postal address — legal entity, department, lines, postal code + city, country. */
export function PostalAddressFields({
  legalEntity = '',
  onLegalEntityChange,
  onLegalEntityFocus,
  onLegalEntityUidSelect,
  legalEntityError,
  legalEntityRequiredLabel,
  legalEntityRequiredShakeKey = 0,
  uidSearchPlaceholder,
  vatId = '',
  onVatIdChange,
  vatIdError,
  department = '',
  onDepartmentChange,
  departmentError,
  street,
  streetLine2 = '',
  postalCode,
  city,
  country = '',
  onCountryChange,
  countryError,
  onStreetChange,
  onStreetLine2Change,
  onPostalCodeChange,
  onCityChange,
  countryDisplayLabel,
  showPostalLines = true,
  showLine2 = true,
  showLine1Label = true,
  optionalBadge,
  line1RequiredLabel,
  requiredShakeKey = 0,
  idPrefix,
  line1Error,
  streetError,
  postalCodeError,
  cityError,
  streetLine2Error,
  onAddressFocus,
}: PostalAddressFieldsProps) {
  const t = useTranslations('common.address');
  const tUidLookup = useTranslations('result.questionnaireStep.uidLookup');
  const legalEntityId = idPrefix ? `${idPrefix}-legal-entity` : undefined;
  const vatIdFieldId = idPrefix ? `${idPrefix}-vat-id` : undefined;
  const streetId = idPrefix ? `${idPrefix}-street` : undefined;
  const departmentId = idPrefix ? `${idPrefix}-department` : undefined;
  const postalId = idPrefix ? `${idPrefix}-postal-code` : undefined;
  const cityId = idPrefix ? `${idPrefix}-city` : undefined;
  const line2Id = idPrefix ? `${idPrefix}-street-line2` : undefined;
  const countryId = idPrefix ? `${idPrefix}-country` : undefined;
  const addressLineError = streetError ?? line1Error;
  const addressLineInvalid = Boolean(addressLineError);
  const postalCodeInvalid = Boolean(postalCodeError);
  const cityInvalid = Boolean(cityError);

  function handleUidSelect(company: UidCompany) {
    onLegalEntityChange?.(company.name);
    if (onLegalEntityUidSelect) {
      onLegalEntityUidSelect(company);
      return;
    }
    onStreetChange(company.street);
    onPostalCodeChange(company.postalCode);
    onCityChange(company.city);
    onVatIdChange?.(`${company.uid} MWST`);
  }

  return (
    <div className="flex flex-col gap-6">
      {onLegalEntityChange ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-foreground text-sm leading-snug font-medium">
            {t('legalEntityName')}
            {legalEntityRequiredLabel ? (
              <ValidationRequiredBadge
                show={Boolean(legalEntityRequiredLabel)}
                shakeKey={legalEntityRequiredShakeKey}
                className="ml-1.5"
              >
                {legalEntityRequiredLabel}
              </ValidationRequiredBadge>
            ) : null}
          </label>
          <UidCompanyLookup
            id={legalEntityId}
            value={legalEntity}
            placeholder={uidSearchPlaceholder ?? tUidLookup('placeholder')}
            onValueChange={onLegalEntityChange}
            onFocus={onLegalEntityFocus}
            aria-invalid={Boolean(legalEntityError)}
            onSelect={handleUidSelect}
          />
          {legalEntityError ? <p className="text-danger text-xs">{legalEntityError}</p> : null}
        </div>
      ) : null}

      {onVatIdChange ? (
        <div className={HALF_FIELD_WIDTH_CLASS}>
          <Field label={t('vatId')}>
            <TextInput
              id={vatIdFieldId}
              value={vatId}
              autoComplete="off"
              optionalLabel={optionalBadge}
              onChange={(event) => {
                onVatIdChange(event.target.value);
              }}
              onFocus={onAddressFocus}
              aria-invalid={Boolean(vatIdError)}
            />
            {vatIdError ? <p className="text-danger text-xs">{vatIdError}</p> : null}
          </Field>
        </div>
      ) : null}

      {onDepartmentChange && showPostalLines ? (
        <Field label={t('department')}>
          <TextInput
            id={departmentId}
            value={department}
            optionalLabel={optionalBadge}
            onChange={(event) => {
              onDepartmentChange(event.target.value);
            }}
            onFocus={onAddressFocus}
          />
          {departmentError ? <p className="text-danger text-xs">{departmentError}</p> : null}
        </Field>
      ) : null}

      {showPostalLines ? (
        showLine1Label ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm leading-snug font-medium">
              {t('line1')}
              {line1RequiredLabel ? (
                <ValidationRequiredBadge
                  show={Boolean(line1RequiredLabel)}
                  shakeKey={requiredShakeKey}
                  className="ml-1.5"
                >
                  {line1RequiredLabel}
                </ValidationRequiredBadge>
              ) : null}
            </label>
            <TextInput
              id={streetId}
              value={street}
              onChange={(event) => {
                onStreetChange(event.target.value);
              }}
              onFocus={onAddressFocus}
              aria-invalid={addressLineInvalid}
            />
            {addressLineError ? <p className="text-danger text-xs">{addressLineError}</p> : null}
          </div>
        ) : (
          <>
            <TextInput
              id={streetId}
              value={street}
              onChange={(event) => {
                onStreetChange(event.target.value);
              }}
              onFocus={onAddressFocus}
              aria-invalid={addressLineInvalid}
            />
            {addressLineError ? <p className="text-danger text-xs">{addressLineError}</p> : null}
          </>
        )
      ) : null}

      {showPostalLines && showLine2 && onStreetLine2Change ? (
        <Field label={t('line2')}>
          <TextInput
            id={line2Id}
            value={streetLine2}
            optionalLabel={optionalBadge}
            onChange={(event) => {
              onStreetLine2Change(event.target.value);
            }}
            onFocus={onAddressFocus}
          />
          {streetLine2Error ? <p className="text-danger text-xs">{streetLine2Error}</p> : null}
        </Field>
      ) : null}

      {showPostalLines ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
          <div className="flex w-20 shrink-0 flex-col gap-1.5">
            <label htmlFor={postalId} className="text-foreground text-sm leading-snug font-medium">
              {t('postalCode')}
            </label>
            <TextInput
              id={postalId}
              value={postalCode}
              onChange={(event) => {
                onPostalCodeChange(event.target.value);
              }}
              onFocus={onAddressFocus}
              aria-invalid={postalCodeInvalid}
            />
            {postalCodeError ? <p className="text-danger text-xs">{postalCodeError}</p> : null}
          </div>
          <div className={`${HALF_FIELD_WIDTH_CLASS} flex flex-col gap-1.5`}>
            <label htmlFor={cityId} className="text-foreground text-sm leading-snug font-medium">
              {t('city')}
            </label>
            <TextInput
              id={cityId}
              value={city}
              onChange={(event) => {
                onCityChange(event.target.value);
              }}
              onFocus={onAddressFocus}
              aria-invalid={cityInvalid}
            />
            {cityError ? <p className="text-danger text-xs">{cityError}</p> : null}
          </div>
        </div>
      ) : null}

      {onCountryChange ? (
        <Field label={t('country')}>
          <CountryAutocomplete
            id={countryId}
            value={country}
            onChange={onCountryChange}
            aria-invalid={Boolean(countryError)}
          />
          {countryError ? <p className="text-danger text-xs">{countryError}</p> : null}
        </Field>
      ) : countryDisplayLabel ? (
        <Field label={t('country')}>
          <TextInput id={countryId} value={countryDisplayLabel} isDisabled />
        </Field>
      ) : null}
    </div>
  );
}
