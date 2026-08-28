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

type EuRepContractFieldsProps = {
  idPrefix?: string;
  legalEntity: string;
  forwardingEmail: string;
  onLegalEntityChange: (value: string) => void;
  onForwardingEmailChange: (value: string) => void;
  legalEntityError?: string;
  forwardingEmailError?: string;
  /** Render one field or both — detail screens split fields into separate sections. */
  fields?: 'both' | 'legalEntity' | 'forwardingEmail';
};

export function EuRepContractFields({
  idPrefix = 'eu-rep',
  legalEntity,
  forwardingEmail,
  onLegalEntityChange,
  onForwardingEmailChange,
  legalEntityError,
  forwardingEmailError,
  fields = 'both',
}: EuRepContractFieldsProps) {
  const t = useTranslations('account.euRep.contract');
  const legalId = `${idPrefix}-legal-entity`;
  const emailId = `${idPrefix}-forwarding-email`;
  const showLegalEntity = fields === 'both' || fields === 'legalEntity';
  const showForwardingEmail = fields === 'both' || fields === 'forwardingEmail';

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
    </div>
  );
}
