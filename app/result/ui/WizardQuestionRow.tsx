import type { ChangeEvent, ReactNode } from 'react';
import { ValidationRequiredBadge } from '@/components/shared/ValidationRequiredBadge';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { cn } from '@/lib/utils';
import { PostalAddressFields } from './PostalAddressFields';
import { RadioGroup, TextInput } from './FormSection';

export type WizardQuestionChoice = { value: string; label: string };

type WizardQuestionLabelProps = {
  label: string;
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
        'text-foreground leading-snug',
        compact ? 'text-sm font-medium' : 'text-base font-semibold'
      )}
    >
      {label}
      {optional && optionalBadgeLabel ? (
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
      }
    | {
        variant: 'address';
        street: string;
        postalCode: string;
        city: string;
        onStreetChange: (value: string) => void;
        onPostalCodeChange: (value: string) => void;
        onCityChange: (value: string) => void;
        streetLine2?: string;
        onStreetLine2Change?: (value: string) => void;
        showLine2?: boolean;
        streetPlaceholder?: string;
        postalPlaceholder?: string;
        cityPlaceholder?: string;
        idPrefix?: string;
        line1Error?: string;
        streetLine2Error?: string;
      }
  );

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
    return (
      <TextInput
        type={props.inputType}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        readOnly={props.readOnly}
        className={props.inputClassName}
      />
    );
  }

  if (props.variant === 'address') {
    return (
      <PostalAddressFields
        street={props.street}
        streetLine2={props.streetLine2}
        postalCode={props.postalCode}
        city={props.city}
        onStreetChange={props.onStreetChange}
        onStreetLine2Change={props.onStreetLine2Change}
        onPostalCodeChange={props.onPostalCodeChange}
        onCityChange={props.onCityChange}
        showLine2={props.showLine2 ?? Boolean(props.onStreetLine2Change)}
        optionalBadge={props.optionalBadgeLabel}
        streetPlaceholder={props.streetPlaceholder}
        postalPlaceholder={props.postalPlaceholder}
        cityPlaceholder={props.cityPlaceholder}
        idPrefix={props.idPrefix}
        line1Error={props.line1Error}
        streetLine2Error={props.streetLine2Error}
      />
    );
  }

  return props.children;
}

export function WizardQuestionRow(props: WizardQuestionRowProps) {
  const {
    id,
    label,
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

  const prompt = (
    <>
      <WizardQuestionLabel
        label={label}
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

  const answer = renderAnswer(props);

  return (
    <div
      id={id}
      className={cn(
        'flex flex-col',
        bordered
          ? 'border-border gap-3 border-b px-4 py-4 sm:px-8 sm:py-6'
          : compact
            ? 'gap-1.5'
            : spacing === 'relaxed'
              ? 'gap-8'
              : 'gap-3 px-4 py-4 sm:px-8 sm:py-6'
      )}
    >
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
