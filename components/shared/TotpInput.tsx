'use client';

import { InputOTP, REGEXP_ONLY_DIGITS } from '@/components/ui';

const TOTP_LENGTH = 6;

export function TotpInput({
  id,
  value,
  onChange,
  isInvalid,
  isDisabled,
  autoFocus,
  'aria-label': ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={TOTP_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      value={value}
      onChange={onChange}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      inputMode="numeric"
      autoComplete="one-time-code"
      // UX: focus first OTP slot on mount
      // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional OTP entry focus
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      variant="secondary"
    >
      <InputOTP.Group>
        {Array.from({ length: TOTP_LENGTH }, (_, index) => (
          <InputOTP.Slot key={index} index={index} />
        ))}
      </InputOTP.Group>
    </InputOTP>
  );
}
