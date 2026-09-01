'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui';

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
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
      {hint && !error ? <p className="text-muted text-xs leading-relaxed">{hint}</p> : null}
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
          hint={t('legalEntityHint')}
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
          <Field
            id={`${idPrefix}-postal-line1`}
            label={t('postalLine1')}
            error={postalErrors?.postalLine1}
          >
            <Input
              id={`${idPrefix}-postal-line1`}
              variant="secondary"
              value={postal.postalLine1}
              onChange={(event) => {
                onPostalChange({ postalLine1: event.target.value });
              }}
              aria-invalid={Boolean(postalErrors?.postalLine1)}
              fullWidth
            />
          </Field>
          <Field id={`${idPrefix}-postal-line2`} label={t('postalLine2')}>
            <Input
              id={`${idPrefix}-postal-line2`}
              variant="secondary"
              value={postal.postalLine2 ?? ''}
              onChange={(event) => {
                onPostalChange({ postalLine2: event.target.value });
              }}
              fullWidth
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id={`${idPrefix}-postal-code`}
              label={t('postalCode')}
              error={postalErrors?.postalCode}
            >
              <Input
                id={`${idPrefix}-postal-code`}
                variant="secondary"
                value={postal.postalCode}
                onChange={(event) => {
                  onPostalChange({ postalCode: event.target.value });
                }}
                aria-invalid={Boolean(postalErrors?.postalCode)}
                fullWidth
              />
            </Field>
            <Field id={`${idPrefix}-city`} label={t('city')} error={postalErrors?.city}>
              <Input
                id={`${idPrefix}-city`}
                variant="secondary"
                value={postal.city}
                onChange={(event) => {
                  onPostalChange({ city: event.target.value });
                }}
                aria-invalid={Boolean(postalErrors?.city)}
                fullWidth
              />
            </Field>
          </div>
          <Field id={`${idPrefix}-country`} label={t('country')} error={postalErrors?.country}>
            <Input
              id={`${idPrefix}-country`}
              variant="secondary"
              value={postal.country}
              onChange={(event) => {
                onPostalChange({ country: event.target.value });
              }}
              aria-invalid={Boolean(postalErrors?.country)}
              fullWidth
            />
          </Field>
        </>
      ) : null}
    </div>
  );
}
