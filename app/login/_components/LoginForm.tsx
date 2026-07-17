'use client';

import { useMemo, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import type { FieldErrors } from 'react-hook-form';
import { ApiError } from '@/api/client';
import { useLogin, type LoginInput } from '@/api/auth';
import { setAuthToken } from '@/lib/auth-session';
import { storeLoginCredential } from '@/lib/store-login-credential';
import { showDangerToast } from '@/components/shared/dangerToast';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { Button, Eye, EyeSlash, Input, InputGroup, Label } from '@/components/ui';

function firstValidationMessage(errors: FieldErrors<LoginInput>): string | undefined {
  return errors.email?.message ?? errors.password?.message;
}

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('login');
  const tv = useTranslations('validation');
  const [showPassword, setShowPassword] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
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
  } = useForm<LoginInput>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const emailInvalid = Boolean(errors.email) || authFailed;
  const passwordInvalid = Boolean(errors.password) || authFailed;

  const clearAuthFailed = () => {
    if (authFailed) {
      setAuthFailed(false);
    }
  };

  const emailField = register('email', { onChange: clearAuthFailed });
  const passwordField = register('password', { onChange: clearAuthFailed });

  function onInvalid(fieldErrors: FieldErrors<LoginInput>) {
    const message = firstValidationMessage(fieldErrors);
    if (message) {
      showDangerToast(message);
    }
  }

  async function onSubmit(values: LoginInput) {
    setAuthFailed(false);

    try {
      const result = await login.mutateAsync(values);
      setAuthToken(result.token);
      await storeLoginCredential(values.email, values.password);
      toast.success(t('success'));
      startTransition(() => {
        router.push('/account');
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthFailed(true);
        showDangerToast(t('errors.invalidCredentials'));
        return;
      }
      showDangerToast(t('errors.generic'));
    }
  }

  return (
    <>
      <h1 className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl">
        {t('title')}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        method="post"
        action="/login"
        autoComplete="on"
        noValidate
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" isInvalid={emailInvalid}>
            {t('email')}
          </Label>
          <Input
            id="email"
            variant="secondary"
            type="email"
            inputMode="email"
            autoComplete="username"
            spellCheck={false}
            placeholder={t('emailPlaceholder')}
            aria-invalid={emailInvalid}
            fullWidth
            {...emailField}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" isInvalid={passwordInvalid}>
            {t('password')}
          </Label>
          <InputGroup variant="secondary" fullWidth data-invalid={passwordInvalid || undefined}>
            <InputGroup.Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              spellCheck={false}
              placeholder={t('passwordPlaceholder')}
              aria-invalid={passwordInvalid}
              className="pr-2"
              {...passwordField}
            />
            <InputGroup.Suffix className="pe-1">
              <button
                type="button"
                onClick={() => {
                  setShowPassword((visible) => !visible);
                }}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                aria-pressed={showPassword}
                className="text-muted hover:text-foreground rounded-md p-1 transition-colors"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </InputGroup.Suffix>
          </InputGroup>
        </div>

        <div className="flex justify-end">
          <NavigationLink href="/login/forgot-password">{t('forgotPassword')}</NavigationLink>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth isDisabled={isSubmitting}>
          {t('submit')}
        </Button>
      </form>
    </>
  );
}
