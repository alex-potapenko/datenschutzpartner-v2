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
import { useIdentifyLogin, useLogin } from '@/api/auth';
import { env } from '@/env';
import { storeLoginCredential } from '@/lib/store-login-credential';
import { showDangerToast } from '@/components/shared/dangerToast';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { TotpInput } from '@/components/shared/TotpInput';
import { Button, Eye, EyeSlash, Input, InputGroup, Label, Spinner } from '@/components/ui';

const TOTP_INPUT_ID = 'login-totp';

type LoginStep = 'email' | 'password' | 'totp';

type EmailStepValues = {
  email: string;
};

type PasswordStepValues = {
  password: string;
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
  const [password, setPassword] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);
  const [totpCode, setTotpCode] = useState('');
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

  const passwordSchema = useMemo(
    () =>
      z.object({
        password: z.string().min(1, tv('required')),
      }),
    [tv]
  );

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
    const frame = requestAnimationFrame(() => {
      if (step === 'password') {
        document.getElementById('password')?.focus();
        return;
      }
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 'totp') return;

    const delay = reduceMotion ? 0 : 300;
    const timer = window.setTimeout(() => {
      document.getElementById(TOTP_INPUT_ID)?.focus();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [reduceMotion, step]);

  const emailInvalid = Boolean(emailForm.formState.errors.email);
  const passwordInvalid = Boolean(passwordForm.formState.errors.password) || authFailed;
  const totpInvalid = authFailed;

  const stepTitle =
    step === 'totp'
      ? twoFactorSetupRequired
        ? t('twoFactorSetupTitle')
        : t('twoFactorVerifyTitle')
      : t('title');

  async function completeLogin(twoFactorCode: string) {
    setAuthFailed(false);

    try {
      await login.mutateAsync({
        email,
        password,
        twoFactorCode,
      });
      await storeLoginCredential(email, password);
      toast.success(t('success'));
      startTransition(() => {
        router.push(returnTo);
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthFailed(true);
        showDangerToast(
          step === 'totp' || requiresTwoFactor
            ? t('errors.invalidCredentialsOr2fa')
            : t('errors.invalidCredentials')
        );
        return;
      }
      showDangerToast(t('errors.generic'));
    }
  }

  async function onEmailSubmit(values: EmailStepValues) {
    setAuthFailed(false);
    const normalizedEmail = values.email.trim().toLowerCase();
    setEmail(normalizedEmail);
    emailForm.setValue('email', normalizedEmail);

    try {
      const result = await identify.mutateAsync({ email: normalizedEmail });
      setRequiresTwoFactor(result.requiresTwoFactor);
      setTwoFactorSetupRequired(result.twoFactorSetupRequired);
      passwordForm.reset({ password: '' });
      setTotpCode('');
      setStep('password');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        toast.success(t('identifyNotice'));
        return;
      }
      showDangerToast(t('errors.generic'));
    }
  }

  function onPasswordSubmit(values: PasswordStepValues) {
    setAuthFailed(false);
    setPassword(values.password);

    if (requiresTwoFactor || twoFactorSetupRequired) {
      setTotpCode('');
      setStep('totp');
      return;
    }

    void completeLogin('');
  }

  function onTotpSubmit() {
    if (totpCode.length !== 6) {
      showDangerToast(tv('required'));
      return;
    }

    void completeLogin(totpCode);
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

    if (step === 'password') {
      void passwordForm.handleSubmit(onPasswordSubmit, (fieldErrors) => {
        const message = firstValidationMessage(fieldErrors);
        if (message) showDangerToast(message);
      })();
      return;
    }

    onTotpSubmit();
  }

  const postEmailStep = step === 'password' || step === 'totp';

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.h1
          key={stepTitle}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={motionTransition}
          className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl"
        >
          {stepTitle}
        </motion.h1>
      </AnimatePresence>

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
            initial={false}
            animate={postEmailStep ? { opacity: reduceMotion ? 1 : 0.72 } : { opacity: 1 }}
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
              readOnly={step !== 'email'}
              fullWidth
              className={step !== 'email' ? 'cursor-default whitespace-nowrap' : undefined}
              {...emailForm.register('email')}
            />
          </motion.div>

          <div className={postEmailStep ? 'min-h-[8.75rem]' : undefined}>
            <AnimatePresence mode="wait" initial={false}>
              {step === 'password' ? (
                <motion.div
                  key="password-fields"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
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

                  <div className="flex justify-end">
                    <NavigationLink href="/login/forgot-password">
                      {t('forgotPassword')}
                    </NavigationLink>
                  </div>
                </motion.div>
              ) : null}

              {step === 'totp' ? (
                <motion.div
                  key="totp-fields"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={motionTransition}
                  className="flex flex-col gap-1.5"
                >
                  <Label htmlFor={TOTP_INPUT_ID} isInvalid={totpInvalid}>
                    {twoFactorSetupRequired ? t('twoFactorSetupBody') : t('twoFactorVerifyBody')}
                  </Label>
                  <TotpInput
                    id={TOTP_INPUT_ID}
                    // UX: move focus to OTP after password step
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional 2FA step focus
                    autoFocus
                    aria-label={t('twoFactorCode')}
                    value={totpCode}
                    isInvalid={totpInvalid}
                    isDisabled={login.isPending}
                    onChange={(value) => {
                      setTotpCode(value);
                      if (authFailed) setAuthFailed(false);
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isPending={
            step === 'email' ? identify.isPending : step === 'password' ? false : login.isPending
          }
          isDisabled={
            step === 'email'
              ? emailForm.formState.isSubmitting || identify.isPending
              : step === 'password'
                ? passwordForm.formState.isSubmitting
                : login.isPending || totpCode.length !== 6
          }
        >
          {step === 'email' ? (
            t('continue')
          ) : step === 'password' ? (
            requiresTwoFactor || twoFactorSetupRequired ? (
              t('continue')
            ) : (
              t('submit')
            )
          ) : login.isPending ? (
            <Spinner size="sm" aria-hidden />
          ) : (
            t('submit')
          )}
        </Button>
      </form>
    </>
  );
}
