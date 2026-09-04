'use client';

import { useTranslations } from 'next-intl';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { Field, TextInput } from './FormSection';

type PostalAddressFieldsProps = {
  street: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  onStreetChange: (value: string) => void;
  onStreetLine2Change?: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  showLine2?: boolean;
  showLine1Label?: boolean;
  optionalBadge?: string;
  line1RequiredLabel?: string;
  streetPlaceholder?: string;
  postalPlaceholder?: string;
  cityPlaceholder?: string;
  idPrefix?: string;
  line1Error?: string;
  streetLine2Error?: string;
};

/** Address line 1 (street, postal code, city) + optional address line 2 — matches the questionnaire layout. */
export function PostalAddressFields({
  street,
  streetLine2 = '',
  postalCode,
  city,
  onStreetChange,
  onStreetLine2Change,
  onPostalCodeChange,
  onCityChange,
  showLine2 = true,
  showLine1Label = true,
  optionalBadge,
  line1RequiredLabel,
  streetPlaceholder,
  postalPlaceholder,
  cityPlaceholder,
  idPrefix,
  line1Error,
  streetLine2Error,
}: PostalAddressFieldsProps) {
  const t = useTranslations('result.questionnaireStep');
  const streetId = idPrefix ? `${idPrefix}-street` : undefined;
  const postalId = idPrefix ? `${idPrefix}-postal-code` : undefined;
  const cityId = idPrefix ? `${idPrefix}-city` : undefined;
  const line2Id = idPrefix ? `${idPrefix}-street-line2` : undefined;

  const line1Row = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 sm:flex-[2]">
        <TextInput
          id={streetId}
          value={street}
          onChange={(event) => {
            onStreetChange(event.target.value);
          }}
          placeholder={streetPlaceholder ?? t('placeholders.street')}
        />
      </div>
      <div className="min-w-0 sm:flex-1">
        <TextInput
          id={postalId}
          value={postalCode}
          onChange={(event) => {
            onPostalCodeChange(event.target.value);
          }}
          placeholder={postalPlaceholder ?? t('placeholders.postalCode')}
        />
      </div>
      <div className="min-w-0 sm:flex-1">
        <TextInput
          id={cityId}
          value={city}
          onChange={(event) => {
            onCityChange(event.target.value);
          }}
          placeholder={cityPlaceholder ?? t('placeholders.city')}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {showLine1Label ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-foreground text-sm leading-snug font-medium">
            {t('fields.streetLine1')}
            {line1RequiredLabel ? (
              <MetaBadge kind="required" className="ml-1.5 align-middle">
                {line1RequiredLabel}
              </MetaBadge>
            ) : null}
          </label>
          {line1Row}
          {line1Error ? <p className="text-danger text-xs">{line1Error}</p> : null}
        </div>
      ) : (
        <>
          {line1Row}
          {line1Error ? <p className="text-danger text-xs">{line1Error}</p> : null}
        </>
      )}
      {showLine2 && onStreetLine2Change ? (
        <Field label={t('fields.streetLine2')} optionalLabel={optionalBadge}>
          <TextInput
            id={line2Id}
            value={streetLine2}
            onChange={(event) => {
              onStreetLine2Change(event.target.value);
            }}
            placeholder={t('placeholders.streetLine2')}
          />
          {streetLine2Error ? <p className="text-danger text-xs">{streetLine2Error}</p> : null}
        </Field>
      ) : null}
    </div>
  );
}
