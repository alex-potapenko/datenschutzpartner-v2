'use client';

import type { SyntheticEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowSquareOut,
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  Input,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { ValidationRequiredBadge } from '@/components/shared/ValidationRequiredBadge';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { Field } from '@/app/result/ui/FormSection';

export type EuRepGuestAccountDraft = {
  firstName: string;
  lastName: string;
  email: string;
  acceptTerms: boolean;
  newsletter: boolean;
};

export type EuRepGuestAccountErrors = Partial<
  Record<keyof EuRepGuestAccountDraft, string | undefined>
>;

type EuRepCheckoutGuestCheckboxesProps = {
  value: EuRepGuestAccountDraft;
  errors: EuRepGuestAccountErrors;
  submitCount: number;
  onChange: (patch: Partial<EuRepGuestAccountDraft>) => void;
  onClearError?: (key: keyof EuRepGuestAccountDraft) => void;
};

export function EuRepCheckoutGuestCheckboxes({
  value,
  errors,
  submitCount,
  onChange,
  onClearError,
}: EuRepCheckoutGuestCheckboxesProps) {
  const tSummary = useTranslations('result.summary');
  const tFooter = useTranslations('footer');
  const tQuestionnaire = useTranslations('result.questionnaireStep');

  function stopCheckboxActivation(event: SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        variant="secondary"
        isSelected={value.acceptTerms}
        onChange={(checked) => {
          onChange({ acceptTerms: checked });
          if (checked) onClearError?.('acceptTerms');
        }}
      >
        <CheckboxControl>
          <CheckboxIndicator />
        </CheckboxControl>
        <CheckboxContent>
          <span className="text-sm leading-snug">
            {tSummary('acceptTermsPrefix')}
            <NavigationLink
              href="/terms"
              target="_blank"
              chevron="none"
              size="sm"
              className="ml-1 inline-flex align-baseline"
              onClick={stopCheckboxActivation}
              onPointerDown={stopCheckboxActivation}
            >
              {tFooter('termsOfService')}
              <ArrowSquareOut size={14} weight="bold" aria-hidden />
            </NavigationLink>
            <ValidationRequiredBadge
              show={Boolean(errors.acceptTerms)}
              shakeKey={submitCount}
              className="ml-1.5"
            >
              {tQuestionnaire('requiredBadge')}
            </ValidationRequiredBadge>
          </span>
        </CheckboxContent>
      </Checkbox>

      <Checkbox
        variant="secondary"
        isSelected={value.newsletter}
        onChange={(checked) => {
          onChange({ newsletter: checked });
        }}
      >
        <CheckboxControl>
          <CheckboxIndicator />
        </CheckboxControl>
        <CheckboxContent>
          <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
            <span>{tSummary('newsletter')}</span>
            <MetaBadge kind="optional" className="shrink-0">
              {tQuestionnaire('optionalBadge')}
            </MetaBadge>
          </span>
        </CheckboxContent>
      </Checkbox>
    </div>
  );
}

type EuRepCheckoutGuestFieldsProps = {
  value: EuRepGuestAccountDraft;
  errors: EuRepGuestAccountErrors;
  onChange: (patch: Partial<EuRepGuestAccountDraft>) => void;
  onClearError?: (key: keyof EuRepGuestAccountDraft) => void;
  showIntro?: boolean;
};

export function EuRepCheckoutGuestFields({
  value,
  errors,
  onChange,
  onClearError,
  showIntro = true,
}: EuRepCheckoutGuestFieldsProps) {
  const t = useTranslations('account.euRepCheckout.guest');
  const tSummary = useTranslations('result.summary');

  return (
    <div className="flex flex-col gap-5">
      {showIntro ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground text-base font-semibold">{t('title')}</h3>
          <p className="text-muted text-sm leading-relaxed">{t('body')}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={tSummary('firstNameLabel')}>
          <Input
            variant="secondary"
            fullWidth
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
            value={value.firstName}
            onChange={(event) => {
              onChange({ firstName: event.target.value });
              onClearError?.('firstName');
            }}
            onFocus={() => {
              onClearError?.('firstName');
            }}
          />
          {errors.firstName ? <p className="text-danger text-xs">{errors.firstName}</p> : null}
        </Field>

        <Field label={tSummary('lastNameLabel')}>
          <Input
            variant="secondary"
            fullWidth
            autoComplete="family-name"
            aria-invalid={Boolean(errors.lastName)}
            value={value.lastName}
            onChange={(event) => {
              onChange({ lastName: event.target.value });
              onClearError?.('lastName');
            }}
            onFocus={() => {
              onClearError?.('lastName');
            }}
          />
          {errors.lastName ? <p className="text-danger text-xs">{errors.lastName}</p> : null}
        </Field>
      </div>

      <Field label={tSummary('emailLabel')} hint={tSummary('emailHint')}>
        <Input
          variant="secondary"
          type="email"
          fullWidth
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          value={value.email}
          onChange={(event) => {
            onChange({ email: event.target.value });
            onClearError?.('email');
          }}
          onFocus={() => {
            onClearError?.('email');
          }}
        />
        {errors.email ? <p className="text-danger text-xs">{errors.email}</p> : null}
      </Field>
    </div>
  );
}
