'use client';

import Link from 'next/link';
import { useMemo, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { useLogin, type LoginInput } from '@/api/auth';
import { Button, CaretRight, Eye, EyeSlash, Input } from '@/components/ui';
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

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('login');
  const tv = useTranslations('validation');
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(tv('email')),
        password: z.string().min(1, tv('required')),
      }),
    [tv]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({ resolver: zodResolver(schema) });

  async function onSubmit(values: LoginInput) {
    try {
      await login.mutateAsync(values);
      toast.success(t('success'));
      startTransition(() => {
        router.push('/');
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setError('root', { message: t('errors.invalidCredentials') });
        return;
      }
      setError('root', { message: t('errors.generic') });
    }
  }

  return (
    <>
      <h1 className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl">
        {t('title')}
      </h1>

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

        <Field id="password" label={t('password')} error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              variant="secondary"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('passwordPlaceholder')}
              aria-invalid={!!errors.password}
              fullWidth
              className="pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => {
                setShowPassword((visible) => !visible);
              }}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              aria-pressed={showPassword}
              className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 transition-colors"
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            href="/login/forgot-password"
            className="inline-flex w-fit items-center gap-1 text-base font-normal transition-colors hover:text-[var(--link-hover)]"
            style={{ color: 'var(--accent)' }}
          >
            {t('forgotPassword')} <CaretRight size={16} />
          </Link>
        </div>

        {errors.root?.message && (
          <p className="text-danger text-sm" role="alert">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth isDisabled={isSubmitting}>
          {t('submit')}
        </Button>
      </form>
    </>
  );
}
