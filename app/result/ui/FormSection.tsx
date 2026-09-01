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
import { MetaBadge } from '@/components/shared/MetaBadge';

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
  hint?: string;
  optionalLabel?: string;
}

export function Field({ label, children, hint, optionalLabel }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-foreground text-sm font-medium">{label}</label>
        {optionalLabel ? <MetaBadge kind="optional">{optionalLabel}</MetaBadge> : null}
      </div>
      {children}
      {hint ? <p className="text-foreground text-xs leading-snug">{hint}</p> : null}
    </div>
  );
}

interface TextInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  readOnly?: boolean;
}

export function TextInput({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  type = 'text',
  className,
  readOnly,
}: TextInputProps) {
  return (
    <Input
      variant="secondary"
      type={type}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      fullWidth
      className={className}
      readOnly={readOnly}
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
              'rounded-full',
              selected && 'border-key-500 bg-key-100 text-foreground border-2'
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
    <span className="font-display border-key-500 bg-key-100 text-foreground inline-flex w-fit items-center rounded-full border-2 px-4 py-2 text-base font-normal">
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
