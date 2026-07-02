'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForgotPassword, type ForgotPasswordInput } from '@/api/auth';
import { Button, CaretLeft, Input } from '@/components/ui';
import { z } from 'zod';

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
      {error && <p className="text-danger mt-0.5 text-xs">{error}</p>}
    </div>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword');
  const tv = useTranslations('validation');
  const [sent, setSent] = useState(false);
  const forgotPassword = useForgotPassword();

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
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(schema) });

  async function onSubmit(values: ForgotPasswordInput) {
    await forgotPassword.mutateAsync(values);
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-foreground mb-4 text-center text-2xl font-bold sm:text-3xl">
          {t('title')}
        </h1>
        <p className="text-foreground mb-6 text-center leading-relaxed">{t('success')}</p>
        <Link
          href="/login"
          className="inline-flex w-fit items-center gap-1 self-center text-base font-normal transition-colors hover:text-[var(--link-hover)]"
          style={{ color: 'var(--accent)' }}
        >
          <CaretLeft size={16} aria-hidden />
          {t('backToLogin')}
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-foreground mb-3 text-center text-2xl font-bold sm:text-3xl">
        {t('title')}
      </h1>
      <p className="text-muted mb-6 text-center text-sm leading-relaxed sm:text-base">
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

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex w-fit items-center gap-1 text-base font-normal transition-colors hover:text-[var(--link-hover)]"
          style={{ color: 'var(--accent)' }}
        >
          <CaretLeft size={16} aria-hidden />
          {t('backToLogin')}
        </Link>
      </div>
    </>
  );
}
