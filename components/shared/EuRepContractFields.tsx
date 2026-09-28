'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui';
import { PostalAddressFields } from '@/app/result/ui/PostalAddressFields';
import { displayCountryLabel, SWISS_COUNTRY_STORAGE } from '@/lib/swiss-country';
import { FieldErrorText } from '@/components/shared/FieldErrorText';

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
      <FieldErrorText message={error} className="mt-0.5" />
    </div>
  );
}

export type EuRepPostalFields = {
  postalDepartment?: string;
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
  onLegalEntityFocus?: () => void;
  onForwardingEmailFocus?: () => void;
  onPostalFieldFocus?: () => void;
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
  onLegalEntityFocus,
  onForwardingEmailFocus,
  onPostalFieldFocus,
  fields = 'both',
}: EuRepContractFieldsProps) {
  const t = useTranslations('account.euRep.contract');
  const tCommon = useTranslations('common');
  const tQuestionnaire = useTranslations('result.questionnaireStep');
  const emailId = `${idPrefix}-forwarding-email`;
  const showForwardingEmail = fields === 'both' || fields === 'forwardingEmail';
  const showAddress =
    (fields === 'both' || fields === 'postal' || fields === 'legalEntity') &&
    postal &&
    onPostalChange;
  const showLegalEntityInAddress = fields === 'both' || fields === 'legalEntity';
  const showPostalLines = fields === 'both' || fields === 'postal';

  return (
    <div className="flex flex-col gap-5">
      {showAddress ? (
        <PostalAddressFields
          idPrefix={idPrefix}
          legalEntity={showLegalEntityInAddress ? legalEntity : undefined}
          onLegalEntityChange={showLegalEntityInAddress ? onLegalEntityChange : undefined}
          onLegalEntityFocus={onLegalEntityFocus}
          legalEntityError={legalEntityError}
          department={showPostalLines ? (postal.postalDepartment ?? '') : undefined}
          onDepartmentChange={
            showPostalLines
              ? (value) => {
                  onPostalChange({ postalDepartment: value });
                }
              : undefined
          }
          departmentError={postalErrors?.postalDepartment}
          street={showPostalLines ? postal.postalLine1 : ''}
          streetLine2={showPostalLines ? postal.postalLine2 : undefined}
          postalCode={showPostalLines ? postal.postalCode : ''}
          city={showPostalLines ? postal.city : ''}
          onStreetChange={(value) => {
            onPostalChange({ postalLine1: value });
          }}
          onStreetLine2Change={
            showPostalLines
              ? (value) => {
                  onPostalChange({ postalLine2: value });
                }
              : undefined
          }
          onPostalCodeChange={(value) => {
            onPostalChange({ postalCode: value });
          }}
          onCityChange={(value) => {
            onPostalChange({ city: value });
          }}
          onLegalEntityUidSelect={(company) => {
            onPostalChange({
              postalLine1: company.street,
              postalCode: company.postalCode,
              city: company.city,
              country: SWISS_COUNTRY_STORAGE,
            });
          }}
          onAddressFocus={onPostalFieldFocus}
          optionalBadge={tQuestionnaire('optionalBadge')}
          streetError={postalErrors?.postalLine1}
          postalCodeError={postalErrors?.postalCode}
          cityError={postalErrors?.city}
          streetLine2Error={postalErrors?.postalLine2}
          showLine2={showPostalLines}
          showPostalLines={showPostalLines}
          countryDisplayLabel={displayCountryLabel(postal.country, tCommon('countrySwitzerland'))}
          countryError={postalErrors?.country}
        />
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
            onFocus={onForwardingEmailFocus}
            aria-invalid={Boolean(forwardingEmailError)}
            aria-label={fields === 'forwardingEmail' ? t('forwardingEmail') : undefined}
            fullWidth
          />
        </Field>
      ) : null}
    </div>
  );
}
