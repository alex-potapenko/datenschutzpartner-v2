import { type ReactNode } from 'react';
import {
  Button,
  Input,
  Checkbox,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { ValidationRequiredBadge } from '@/components/shared/ValidationRequiredBadge';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="border-border flex flex-col gap-6 border-b py-10 last:border-b-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-base font-semibold">{title}</h3>
        {description && <p className="text-muted text-sm">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
  /** Id of the control this label belongs to — set it whenever the control has an id. */
  htmlFor?: string;
  description?: string;
  descriptionClassName?: string;
  hint?: string;
  hintClassName?: string;
  required?: boolean;
  requiredLabel?: string;
  requiredShakeKey?: number;
  /** When set, suppresses the required chip (inline error already shown). */
  error?: string;
}

export function Field({
  label,
  children,
  htmlFor,
  description,
  descriptionClassName,
  hint,
  hintClassName,
  required,
  requiredLabel,
  requiredShakeKey,
  error,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-foreground text-sm leading-snug font-medium">
        {label}
        {requiredLabel ? (
          <ValidationRequiredBadge
            show={Boolean(required)}
            fieldError={error}
            shakeKey={requiredShakeKey}
            className="ml-1.5"
          >
            {requiredLabel}
          </ValidationRequiredBadge>
        ) : null}
      </label>
      {description ? (
        <p className={cn('text-muted text-sm leading-relaxed', descriptionClassName)}>
          {description}
        </p>
      ) : null}
      {children}
      {hint ? (
        <p className={cn('text-xs leading-snug', hintClassName ?? 'text-foreground')}>{hint}</p>
      ) : null}
    </div>
  );
}

interface TextInputProps {
  id?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  readOnly?: boolean;
  isDisabled?: boolean;
  autoComplete?: string;
  'aria-invalid'?: boolean;
  optionalLabel?: string;
  fullWidth?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  min?: number;
}

export function TextInput({
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  type = 'text',
  className,
  readOnly,
  isDisabled,
  autoComplete,
  'aria-invalid': ariaInvalid,
  optionalLabel,
  fullWidth = true,
  inputMode,
  min,
}: TextInputProps) {
  return (
    <Input
      id={id}
      variant="secondary"
      type={type}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder ?? optionalLabel}
      fullWidth={fullWidth}
      className={className}
      readOnly={readOnly}
      disabled={isDisabled}
      autoComplete={autoComplete}
      aria-invalid={ariaInvalid}
      inputMode={inputMode}
      min={min}
    />
  );
}

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (v: string) => void;
}

export function RadioGroup({ options, value, onChange }: RadioGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            size="lg"
            variant="outline"
            className={cn(
              'rounded-full border-0',
              selected
                ? 'bg-key-100 text-foreground [box-shadow:inset_0_0_0_2px_var(--key-500)]'
                : '[box-shadow:inset_0_0_0_2px_var(--border)]'
            )}
            onPress={() => {
              onChange(opt.value);
            }}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

interface AnswerPillProps {
  label: string;
}

/** Read-only pill matching the selected state of {@link RadioGroup}. */
export function AnswerPill({ label }: AnswerPillProps) {
  return (
    <span className="font-display bg-key-100 text-foreground inline-flex w-fit items-center rounded-full px-4 py-2 text-base font-normal [box-shadow:inset_0_0_0_2px_var(--key-500)]">
      {label}
    </span>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <Checkbox variant="secondary" isSelected={checked} onChange={onChange}>
      <CheckboxControl>
        <CheckboxIndicator />
      </CheckboxControl>
      <CheckboxContent>{label}</CheckboxContent>
    </Checkbox>
  );
}
