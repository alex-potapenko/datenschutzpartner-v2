'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForgotPassword, type ForgotPasswordInput } from '@/api/auth';
import { Button, EnvelopeSimple, Input } from '@/components/ui';
import { z } from 'zod';
import { useLoginDev } from './login-dev-context';
import { FieldErrorText } from '@/components/shared/FieldErrorText';

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children}
      <FieldErrorText message={error} className="mt-0.5" />
    </div>
  );
}

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const t = useTranslations('forgotPassword');
  const tv = useTranslations('validation');
  const [sent, setSent] = useState(false);
  const forgotPassword = useForgotPassword();
  const { setPrototypePasswordSetupUrl } = useLoginDev();
  const emailFromQuery = searchParams.get('email')?.trim().toLowerCase() ?? '';

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(tv('email')),
      }),
    [tv]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailFromQuery },
  });

  useEffect(() => {
    if (emailFromQuery) {
      reset({ email: emailFromQuery });
    }
  }, [emailFromQuery, reset]);

  useEffect(() => {
    return () => {
      setPrototypePasswordSetupUrl(null);
    };
  }, [setPrototypePasswordSetupUrl]);

  async function onSubmit(values: ForgotPasswordInput) {
    const result = await forgotPassword.mutateAsync(values);
    setPrototypePasswordSetupUrl(result.prototypeSetupUrl ?? null);
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl">
          {t('successTitle')}
        </h1>
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <span
            className="bg-key-50 flex size-11 shrink-0 items-center justify-center rounded-xl"
            aria-hidden
          >
            <EnvelopeSimple size={22} weight="fill" className="text-accent" />
          </span>
          <p className="text-foreground text-sm leading-relaxed">
            {t('successNotice')}
            <br />
            {t('successInbox')}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-foreground mb-3 text-center text-2xl font-bold sm:text-3xl">
        {t('title')}
      </h1>
      <p className="text-foreground mb-6 text-center text-sm leading-relaxed whitespace-pre-line sm:text-base">
        {t('description')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Field id="email" label={t('email')} error={errors.email?.message}>
          <Input
            id="email"
            variant="secondary"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            aria-invalid={!!errors.email}
            fullWidth
            {...register('email')}
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" fullWidth isDisabled={isSubmitting}>
          {t('submit')}
        </Button>
      </form>
    </>
  );
}
