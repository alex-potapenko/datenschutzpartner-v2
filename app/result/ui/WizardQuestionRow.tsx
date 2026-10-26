import type { ChangeEvent, ReactNode } from 'react';
import type { UidCompany } from '@/api/uid-registry';
import { ValidationRequiredBadge } from '@/components/shared/ValidationRequiredBadge';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { FieldErrorText } from '@/components/shared/FieldErrorText';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/shared/InfoTooltip';
import { PostalAddressFields } from './PostalAddressFields';
import { UidCompanyLookup } from './UidCompanyLookup';
import { Field, RadioGroup, TextInput } from './FormSection';

export type WizardQuestionChoice = { value: string; label: string };

type WizardQuestionLabelProps = {
  label: string;
  infoTooltip?: string;
  optional?: boolean;
  optionalBadgeLabel?: string;
  required?: boolean;
  /** Shown only when `required` is true (validation state). */
  requiredBadgeLabel?: string;
  /** Increment on each validation attempt to replay the shake. */
  requiredShakeKey?: number;
  compact?: boolean;
};

export function WizardQuestionLabel({
  label,
  infoTooltip,
  optional,
  optionalBadgeLabel,
  required,
  requiredBadgeLabel,
  requiredShakeKey,
  compact = false,
}: WizardQuestionLabelProps) {
  return (
    <p
      className={cn(
        'text-foreground flex flex-wrap items-center gap-1 leading-snug',
        compact ? 'text-sm font-medium' : 'text-lg font-semibold'
      )}
    >
      <span>{label}</span>
      {infoTooltip ? <InfoTooltip label={label}>{infoTooltip}</InfoTooltip> : null}
      {optional && !compact && optionalBadgeLabel ? (
        <MetaBadge kind="optional" className="ml-1.5 align-middle">
          {optionalBadgeLabel}
        </MetaBadge>
      ) : null}
      {requiredBadgeLabel ? (
        <ValidationRequiredBadge
          show={Boolean(required)}
          shakeKey={requiredShakeKey}
          className="ml-1.5"
        >
          {requiredBadgeLabel}
        </ValidationRequiredBadge>
      ) : null}
    </p>
  );
}

type WizardQuestionRowShared = WizardQuestionLabelProps & {
  id?: string;
  /** Dialog help — not used on address field groups. */
  infoTooltip?: string;
  /** Optional helper copy under the question. */
  description?: string;
  hint?: string;
  /** Bordered section row — EU Rep wizard questions. */
  bordered?: boolean;
  /** Extra spacing before follow-up content after toggle buttons. */
  followUpClassName?: string;
  /**
   * `default` — compact stack for questionnaire rows.
   * `relaxed` — larger gap between prompt block and answer (standalone flows).
   */
  spacing?: 'default' | 'relaxed';
  /** When `spacing="relaxed"`, adds `pb-6` below answers. Default: true. */
  relaxedBottomPadding?: boolean;
};

export type WizardQuestionRowProps = WizardQuestionRowShared &
  (
    | { variant?: 'custom'; children: ReactNode }
    | {
        variant: 'choices';
        name: string;
        options: WizardQuestionChoice[];
        value: string;
        onChange: (value: string) => void;
        followUp?: ReactNode;
      }
    | {
        variant: 'text';
        value: string;
        onChange: (event: ChangeEvent<HTMLInputElement>) => void;
        inputType?: string;
        placeholder?: string;
        readOnly?: boolean;
        inputClassName?: string;
        /** Swiss UID register lookup — company / legal entity name fields. */
        uidLookup?: boolean;
        onUidCompanySelect?: (company: UidCompany) => void;
      }
    | {
        variant: 'address';
        street: string;
        postalCode: string;
        city: string;
        onStreetChange: (value: string) => void;
        onPostalCodeChange: (value: string) => void;
        onCityChange: (value: string) => void;
        legalEntity?: string;
        onLegalEntityChange?: (value: string) => void;
        onLegalEntityUidSelect?: (company: UidCompany) => void;
        legalEntityError?: string;
        department?: string;
        onDepartmentChange?: (value: string) => void;
        departmentError?: string;
        countryDisplayLabel?: string;
        streetLine2?: string;
        onStreetLine2Change?: (value: string) => void;
        showLine2?: boolean;
        idPrefix?: string;
        line1Error?: string;
        postalCodeError?: string;
        cityError?: string;
        streetLine2Error?: string;
        legalEntityInfoTooltip?: string;
        departmentInfoTooltip?: string;
      }
  );

function usesFieldLabel(props: WizardQuestionRowProps) {
  return props.variant === 'text' || props.variant === undefined;
}

function renderAnswer(props: WizardQuestionRowProps) {
  if (props.variant === 'choices') {
    return (
      <div className="flex flex-col">
        <RadioGroup
          name={props.name}
          options={props.options}
          value={props.value}
          onChange={props.onChange}
        />
        {props.followUp ? (
          <div className={cn('flex flex-col gap-4', props.followUpClassName)}>{props.followUp}</div>
        ) : null}
      </div>
    );
  }

  if (props.variant === 'text') {
    if (props.uidLookup) {
      return (
        <>
          <UidCompanyLookup
            id={props.id}
            value={props.value}
            onValueChange={(next) => {
              props.onChange({
                target: { value: next },
              } as ChangeEvent<HTMLInputElement>);
            }}
            onSelect={(company) => {
              props.onUidCompanySelect?.(company);
            }}
            aria-invalid={Boolean(props.required)}
          />
          <FieldErrorText message={props.required ? props.requiredBadgeLabel : undefined} />
        </>
      );
    }

    return (
      <>
        <TextInput
          id={props.id}
          type={props.inputType}
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder}
          readOnly={props.readOnly}
          className={props.inputClassName}
          optionalLabel={props.optional ? props.optionalBadgeLabel : undefined}
          aria-invalid={Boolean(props.required)}
        />
        <FieldErrorText message={props.required ? props.requiredBadgeLabel : undefined} />
      </>
    );
  }

  if (props.variant === 'address') {
    return (
      <PostalAddressFields
        legalEntity={props.legalEntity}
        onLegalEntityChange={props.onLegalEntityChange}
        onLegalEntityUidSelect={props.onLegalEntityUidSelect}
        legalEntityError={props.legalEntityError}
        department={props.department}
        onDepartmentChange={props.onDepartmentChange}
        departmentError={props.departmentError}
        street={props.street}
        streetLine2={props.streetLine2}
        postalCode={props.postalCode}
        city={props.city}
        onStreetChange={props.onStreetChange}
        onStreetLine2Change={props.onStreetLine2Change}
        onPostalCodeChange={props.onPostalCodeChange}
        onCityChange={props.onCityChange}
        countryDisplayLabel={props.countryDisplayLabel}
        showLine2={props.showLine2 ?? Boolean(props.onStreetLine2Change)}
        optionalBadge={props.optionalBadgeLabel}
        idPrefix={props.idPrefix}
        line1Error={props.line1Error}
        postalCodeError={props.postalCodeError}
        cityError={props.cityError}
        streetLine2Error={props.streetLine2Error}
        legalEntityInfoTooltip={props.legalEntityInfoTooltip}
        departmentInfoTooltip={props.departmentInfoTooltip}
      />
    );
  }

  return props.children;
}

export function WizardQuestionRow(props: WizardQuestionRowProps) {
  const {
    id,
    label,
    infoTooltip,
    description,
    hint,
    optional,
    optionalBadgeLabel,
    required,
    requiredBadgeLabel,
    requiredShakeKey,
    compact = false,
    bordered = false,
    spacing = 'default',
    relaxedBottomPadding = true,
  } = props;

  const fieldLabel = usesFieldLabel(props);
  const answer = renderAnswer(props);

  const rowClassName = cn(
    'flex flex-col',
    bordered
      ? 'border-border gap-3 border-b px-4 py-4 sm:px-8 sm:py-6'
      : compact
        ? 'gap-1.5'
        : spacing === 'relaxed'
          ? 'gap-8'
          : 'gap-3 px-4 py-4 sm:px-8 sm:py-6'
  );

  if (fieldLabel) {
    const showRequiredChip = props.variant !== 'text';
    return (
      <div id={id} className={rowClassName}>
        <Field
          htmlFor={id}
          label={label}
          description={description}
          infoTooltip={infoTooltip}
          infoTooltipLabel={label}
          required={required}
          requiredLabel={showRequiredChip ? requiredBadgeLabel : undefined}
          requiredShakeKey={requiredShakeKey}
          hint={hint}
          hintClassName="text-muted"
        >
          {answer}
        </Field>
      </div>
    );
  }

  const prompt = (
    <>
      <WizardQuestionLabel
        label={label}
        infoTooltip={infoTooltip}
        optional={optional}
        optionalBadgeLabel={optionalBadgeLabel}
        required={required}
        requiredBadgeLabel={requiredBadgeLabel}
        requiredShakeKey={requiredShakeKey}
        compact={compact}
      />
      {description ? <p className="text-muted text-sm leading-relaxed">{description}</p> : null}
      {spacing === 'default' && hint ? <p className="text-muted text-xs">{hint}</p> : null}
    </>
  );

  return (
    <div id={id} className={rowClassName}>
      {spacing === 'relaxed' ? <div className="flex flex-col gap-4">{prompt}</div> : prompt}
      <div
        className={cn(
          'flex flex-col gap-3',
          spacing === 'relaxed' && relaxedBottomPadding && 'pb-6'
        )}
      >
        {answer}
        {spacing === 'relaxed' && hint ? <p className="text-muted text-xs">{hint}</p> : null}
      </div>
    </div>
  );
}
