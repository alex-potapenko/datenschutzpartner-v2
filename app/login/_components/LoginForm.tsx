'use client';

import { useEffect, useMemo, useState, startTransition, type SyntheticEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { FieldErrors } from 'react-hook-form';
import { ApiError } from '@/api/client';
import { useIdentifyLogin, useLogin, type AccountRole } from '@/api/auth';
import { env } from '@/env';
import { storeLoginCredential } from '@/lib/store-login-credential';
import { showDangerToast } from '@/components/shared/dangerToast';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { Button, Eye, EyeSlash, Input, InputGroup, Label } from '@/components/ui';

type LoginStep = 'email' | 'password';

type EmailStepValues = {
  email: string;
};

type PasswordStepValues = {
  password: string;
  twoFactorCode?: string;
};

const PROTOTYPE_EMAIL_DEFAULT =
  env.NEXT_PUBLIC_API_MOCKING === 'enabled' ? 'lucas.baumgartner@gmail.com' : undefined;

const revealTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

function firstValidationMessage(errors: FieldErrors<EmailStepValues | PasswordStepValues>) {
  const first = Object.values(errors)[0];
  return typeof first?.message === 'string' ? first.message : undefined;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('login');
  const tv = useTranslations('validation');
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccountRole>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  const identify = useIdentifyLogin();
  const login = useLogin();

  const motionTransition = {
    ...revealTransition,
    duration: reduceMotion ? 0 : revealTransition.duration,
  };

  const emailSchema = useMemo(
    () =>
      z.object({
        email: z.email(tv('email')),
      }),
    [tv]
  );

  const requiresTwoFactor = role === 'admin';

  const passwordSchema = useMemo(() => {
    const base = z.object({
      password: z.string().min(1, tv('required')),
      twoFactorCode: z.string().optional(),
    });

    if (!requiresTwoFactor) return base;

    return base.extend({
      twoFactorCode: z.string().min(1, tv('required')),
    });
  }, [tv, requiresTwoFactor]);

  const emailForm = useForm<EmailStepValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: PROTOTYPE_EMAIL_DEFAULT ?? '' },
  });

  const passwordForm = useForm<PasswordStepValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const returnTo = searchParams.get('returnTo') ?? '/account';

  useEffect(() => {
    if (step !== 'password') return;

    const frame = requestAnimationFrame(() => {
      document.getElementById('password')?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [step]);

  const emailInvalid = Boolean(emailForm.formState.errors.email);
  const passwordInvalid =
    Boolean(passwordForm.formState.errors.password) ||
    Boolean(passwordForm.formState.errors.twoFactorCode) ||
    authFailed;

  async function onEmailSubmit(values: EmailStepValues) {
    setAuthFailed(false);
    const normalizedEmail = values.email.trim().toLowerCase();
    setEmail(normalizedEmail);
    emailForm.setValue('email', normalizedEmail);

    try {
      const result = await identify.mutateAsync({ email: normalizedEmail });
      setRole(result.role);
      passwordForm.reset({ password: '', twoFactorCode: '' });
      setStep('password');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        showDangerToast(t('errors.unknownEmail'));
        return;
      }
      showDangerToast(t('errors.generic'));
    }
  }

  async function onPasswordSubmit(values: PasswordStepValues) {
    setAuthFailed(false);

    try {
      await login.mutateAsync({
        email,
        password: values.password,
        twoFactorCode: values.twoFactorCode,
      });
      await storeLoginCredential(email, values.password);
      toast.success(t('success'));
      startTransition(() => {
        router.push(returnTo);
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthFailed(true);
        showDangerToast(
          requiresTwoFactor ? t('errors.invalidCredentialsOr2fa') : t('errors.invalidCredentials')
        );
        return;
      }
      showDangerToast(t('errors.generic'));
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 'email') {
      void emailForm.handleSubmit(onEmailSubmit, (fieldErrors) => {
        const message = firstValidationMessage(fieldErrors);
        if (message) showDangerToast(message);
      })();
      return;
    }

    void passwordForm.handleSubmit(onPasswordSubmit, (fieldErrors) => {
      const message = firstValidationMessage(fieldErrors);
      if (message) showDangerToast(message);
    })();
  }

  return (
    <>
      <h1 className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl">
        {t('title')}
      </h1>

      <form
        onSubmit={onSubmit}
        method="post"
        action="/login"
        autoComplete="on"
        noValidate
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-5">
          <motion.div
            layout={!reduceMotion}
            initial={false}
            animate={
              step === 'password'
                ? { opacity: reduceMotion ? 1 : 0.72, y: reduceMotion ? 0 : -2 }
                : { opacity: 1, y: 0 }
            }
            transition={motionTransition}
            className="flex flex-col gap-1.5"
          >
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
              readOnly={step === 'password'}
              fullWidth
              className={step === 'password' ? 'cursor-default whitespace-nowrap' : undefined}
              {...emailForm.register('email')}
            />
          </motion.div>

          <AnimatePresence initial={false}>
            {step === 'password' ? (
              <motion.div
                key="password-fields"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                transition={motionTransition}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" isInvalid={passwordInvalid}>
                    {t('password')}
                  </Label>
                  <InputGroup
                    variant="secondary"
                    fullWidth
                    data-invalid={passwordInvalid || undefined}
                  >
                    <InputGroup.Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      spellCheck={false}
                      placeholder={t('passwordPlaceholder')}
                      aria-invalid={passwordInvalid}
                      className="pr-2"
                      {...passwordForm.register('password', {
                        onChange: () => {
                          if (authFailed) setAuthFailed(false);
                        },
                      })}
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

                {requiresTwoFactor ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="twoFactorCode" isInvalid={passwordInvalid}>
                      {t('twoFactorCode')}
                    </Label>
                    <Input
                      id="twoFactorCode"
                      variant="secondary"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder={t('twoFactorPlaceholder')}
                      aria-invalid={passwordInvalid}
                      fullWidth
                      {...passwordForm.register('twoFactorCode', {
                        onChange: () => {
                          if (authFailed) setAuthFailed(false);
                        },
                      })}
                    />
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <NavigationLink href="/login/forgot-password">
                    {t('forgotPassword')}
                  </NavigationLink>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isPending={step === 'email' ? identify.isPending : login.isPending}
          isDisabled={
            step === 'email'
              ? emailForm.formState.isSubmitting || identify.isPending
              : passwordForm.formState.isSubmitting || login.isPending
          }
        >
          {step === 'email' ? t('continue') : t('submit')}
        </Button>
      </form>
    </>
  );
}
