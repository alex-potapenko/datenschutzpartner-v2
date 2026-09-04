'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui';
import { displayCountryLabel } from '@/lib/swiss-country';
import { PostalAddressFields } from '@/app/result/ui/PostalAddressFields';

function Field({
  id,
  label,
  hint,
  hintClassName,
  error,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  hintClassName?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <p className={hintClassName ?? 'text-muted text-xs leading-relaxed'}>{hint}</p>
      ) : null}
      {error ? <p className="text-danger mt-0.5 text-xs">{error}</p> : null}
    </div>
  );
}

export type EuRepPostalFields = {
  postalLine1: string;
  postalLine2?: string;
  postalCode: string;
  city: string;
  country: string;
};

type EuRepContractFieldsProps = {
  idPrefix?: string;
  legalEntity: string;
  forwardingEmail: string;
  onLegalEntityChange: (value: string) => void;
  onForwardingEmailChange: (value: string) => void;
  legalEntityError?: string;
  forwardingEmailError?: string;
  postal?: EuRepPostalFields;
  onPostalChange?: (patch: Partial<EuRepPostalFields>) => void;
  postalErrors?: Partial<Record<keyof EuRepPostalFields, string>>;
  /** Render one field group or all — detail screens split fields into separate sections. */
  fields?: 'both' | 'legalEntity' | 'forwardingEmail' | 'postal';
};

export function EuRepContractFields({
  idPrefix = 'eu-rep',
  legalEntity,
  forwardingEmail,
  onLegalEntityChange,
  onForwardingEmailChange,
  legalEntityError,
  forwardingEmailError,
  postal,
  onPostalChange,
  postalErrors,
  fields = 'both',
}: EuRepContractFieldsProps) {
  const t = useTranslations('account.euRep.contract');
  const tCommon = useTranslations('common');
  const legalId = `${idPrefix}-legal-entity`;
  const emailId = `${idPrefix}-forwarding-email`;
  const showLegalEntity = fields === 'both' || fields === 'legalEntity';
  const showForwardingEmail = fields === 'both' || fields === 'forwardingEmail';
  const showPostal = (fields === 'both' || fields === 'postal') && postal && onPostalChange;

  return (
    <div className="flex flex-col gap-5">
      {showLegalEntity ? (
        <Field
          id={legalId}
          label={fields === 'both' ? t('name') : undefined}
          error={legalEntityError}
        >
          <Input
            id={legalId}
            variant="secondary"
            value={legalEntity}
            onChange={(event) => {
              onLegalEntityChange(event.target.value);
            }}
            aria-invalid={Boolean(legalEntityError)}
            aria-label={fields === 'legalEntity' ? t('name') : undefined}
            fullWidth
          />
        </Field>
      ) : null}
      {showForwardingEmail ? (
        <Field
          id={emailId}
          label={fields === 'both' ? t('forwardingEmail') : undefined}
          hint={t('forwardingEmailHint')}
          hintClassName="text-foreground text-sm leading-relaxed"
          error={forwardingEmailError}
        >
          <Input
            id={emailId}
            type="email"
            variant="secondary"
            value={forwardingEmail}
            onChange={(event) => {
              onForwardingEmailChange(event.target.value);
            }}
            aria-invalid={Boolean(forwardingEmailError)}
            aria-label={fields === 'forwardingEmail' ? t('forwardingEmail') : undefined}
            fullWidth
          />
        </Field>
      ) : null}
      {showPostal ? (
        <>
          <PostalAddressFields
            idPrefix={idPrefix}
            street={postal.postalLine1}
            streetLine2={postal.postalLine2}
            postalCode={postal.postalCode}
            city={postal.city}
            onStreetChange={(value) => {
              onPostalChange({ postalLine1: value });
            }}
            onStreetLine2Change={(value) => {
              onPostalChange({ postalLine2: value });
            }}
            onPostalCodeChange={(value) => {
              onPostalChange({ postalCode: value });
            }}
            onCityChange={(value) => {
              onPostalChange({ city: value });
            }}
            line1Error={postalErrors?.postalLine1 ?? postalErrors?.postalCode ?? postalErrors?.city}
            streetLine2Error={postalErrors?.postalLine2}
          />
          <Field id={`${idPrefix}-country`} label={t('country')}>
            <p className="text-foreground text-sm leading-relaxed">
              {displayCountryLabel(postal.country, tCommon('countrySwitzerland'))}
            </p>
          </Field>
        </>
      ) : null}
    </div>
  );
}
