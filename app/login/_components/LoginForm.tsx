'use client';

import {
  useEffect,
  useMemo,
  useState,
  startTransition,
  type SyntheticEvent,
  type TransitionEvent,
} from 'react';
import Link from 'next/link';
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
import {
  readPrototypeMagicLoginUrl,
  storePrototypeMagicLoginUrl,
} from '@/lib/magic-login-prototype';
import { useLoginDev } from './login-dev-context';
import { storeLoginCredential } from '@/lib/store-login-credential';
import { showDangerToast } from '@/components/shared/dangerToast';
import { Logo } from '@/components/shared/Logo';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { TotpInput } from '@/components/shared/TotpInput';
import { TwoFactorProactiveOffer } from '@/components/shared/two-factor';
import { navigationLinkClassName } from '@/components/shared/NavigationLink';
import {
  Button,
  CaretRight,
  CheckCircle,
  Chip,
  Eye,
  EyeSlash,
  Input,
  InputGroup,
  Label,
  PencilSimple,
  Spinner,
  cn,
} from '@/components/ui';

const TOTP_INPUT_ID = 'login-totp';

type LoginStep = 'email' | 'password' | 'totp' | 'magic_link_sent';

type EmailStepValues = {
  email: string;
};

type PasswordStepValues = {
  password: string;
};

const PROTOTYPE_EMAIL_DEFAULT =
  env.NEXT_PUBLIC_API_MOCKING === 'enabled' ? 'lucas.baumgartner@gmail.com' : undefined;

const revealTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const stepSlideOffset = 20;

function firstValidationMessage(errors: FieldErrors<EmailStepValues | PasswordStepValues>) {
  const first = Object.values(errors)[0];
  return typeof first?.message === 'string' ? first.message : undefined;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('login');
  const tc = useTranslations('common');
  const tv = useTranslations('validation');
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const [isCollapsingPostEmailBlock, setIsCollapsingPostEmailBlock] = useState(false);
  const [twoFactorProactiveOpen, setTwoFactorProactiveOpen] = useState(false);

  const identify = useIdentifyLogin();
  const login = useLogin();
  const { setStep: setDevStep } = useLoginDev();
  const [adminMagicLinkReady, setAdminMagicLinkReady] = useState(false);

  useEffect(() => {
    setDevStep(step);
  }, [setDevStep, step]);

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

  async function completeLogin(credential: { twoFactorCode?: string; recoveryCode?: string }) {
    setAuthFailed(false);

    try {
      const result = await login.mutateAsync({
        email,
        password,
        ...credential,
      });

      const setupToken = result.setupToken;
      if (result.twoFactorSetupRequired && setupToken) {
        // Password was accepted, but this account cannot get a session before
        // an authenticator is configured.
        startTransition(() => {
          router.push(`/set-password?token=${encodeURIComponent(setupToken)}`);
        });
        return;
      }

      await storeLoginCredential(email, password);
      toast.success(t('success'));
      if (result.suggestTwoFactorSetup) {
        setTwoFactorProactiveOpen(true);
        return;
      }
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

      if (result.loginMethod === 'magic_link') {
        const isAdminLink = Boolean(result.prototypeMagicLinkUrl);
        setAdminMagicLinkReady(isAdminLink);
        if (result.prototypeMagicLinkUrl) {
          storePrototypeMagicLoginUrl(result.prototypeMagicLinkUrl);
        }
        setStep('magic_link_sent');
        return;
      }

      setAdminMagicLinkReady(false);

      setRequiresTwoFactor(result.requiresTwoFactor ?? false);
      setTwoFactorSetupRequired(result.twoFactorSetupRequired ?? false);
      passwordForm.reset({ password: '' });
      setTotpCode('');
      setStep('password');
    } catch {
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

    void completeLogin({});
  }

  function onTotpSubmit() {
    if (useRecoveryCode) {
      if (!recoveryCode.trim()) {
        showDangerToast(tv('required'));
        return;
      }

      void completeLogin({ recoveryCode: recoveryCode.trim() });
      return;
    }

    if (totpCode.length !== 6) {
      showDangerToast(tv('required'));
      return;
    }

    void completeLogin({ twoFactorCode: totpCode });
  }

  const postEmailStep = step === 'password' || step === 'totp' || step === 'magic_link_sent';
  const isPostEmailBlockOpen = postEmailStep && !isCollapsingPostEmailBlock;

  function openAdminMagicLink() {
    const url = readPrototypeMagicLoginUrl();
    if (!url) {
      toast.error(t('devMagicLinkMissing'));
      return;
    }
    router.push(url);
  }

  function completeEmailStepReset() {
    setStep('email');
    setAdminMagicLinkReady(false);
    setAuthFailed(false);
    setPassword('');
    setRequiresTwoFactor(false);
    setTwoFactorSetupRequired(false);
    setTotpCode('');
    setUseRecoveryCode(false);
    setRecoveryCode('');
    setShowPassword(false);
    setIsCollapsingPostEmailBlock(false);
    passwordForm.reset({ password: '' });
    requestAnimationFrame(() => {
      document.getElementById('email')?.focus();
    });
  }

  function resetToEmailStep() {
    if (!postEmailStep || isCollapsingPostEmailBlock) return;

    setIsCollapsingPostEmailBlock(true);
    if (reduceMotion) {
      completeEmailStepReset();
    }
  }

  function handlePostEmailBlockTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== 'grid-template-rows' || event.target !== event.currentTarget) {
      return;
    }
    if (isCollapsingPostEmailBlock) {
      completeEmailStepReset();
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

    if (step === 'password') {
      void passwordForm.handleSubmit(onPasswordSubmit, (fieldErrors) => {
        const message = firstValidationMessage(fieldErrors);
        if (message) showDangerToast(message);
      })();
      return;
    }

    onTotpSubmit();
  }

  const expandDurationMs = reduceMotion ? 0 : revealTransition.duration * 1000;

  return (
    <>
      <div className="flex flex-col items-center">
        <Link
          href="/"
          aria-label={tc('home')}
          className="mb-4 cursor-pointer text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          <Logo inverse={false} />
        </Link>
        <h1 className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl">
          {t('title')}
        </h1>
      </div>

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
            animate={isPostEmailBlockOpen ? { opacity: reduceMotion ? 1 : 0.72 } : { opacity: 1 }}
            transition={motionTransition}
            className="flex flex-col gap-1.5 overflow-visible"
          >
            <Label htmlFor="email" isInvalid={emailInvalid}>
              {t('email')}
            </Label>
            <div className="relative overflow-visible">
              <InputGroup variant="secondary" fullWidth data-invalid={emailInvalid || undefined}>
                <InputGroup.Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder={t('emailPlaceholder')}
                  aria-invalid={emailInvalid}
                  readOnly={step !== 'email'}
                  className={step !== 'email' ? 'cursor-default pe-2 whitespace-nowrap' : 'pe-2'}
                  {...emailForm.register('email')}
                />
                <AnimatePresence initial={false}>
                  {isPostEmailBlockOpen ? (
                    <InputGroup.Suffix className="pe-2">
                      <motion.span
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                        transition={motionTransition}
                        className="inline-flex"
                      >
                        <CheckCircle size={20} weight="fill" className="text-success" aria-hidden />
                      </motion.span>
                    </InputGroup.Suffix>
                  ) : null}
                </AnimatePresence>
              </InputGroup>
              <AnimatePresence initial={false}>
                {isPostEmailBlockOpen ? (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                    transition={motionTransition}
                    className="absolute top-1/2 left-full z-10 ms-2 -translate-y-1/2"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isIconOnly
                      aria-label={t('editEmail')}
                      className="shrink-0"
                      isDisabled={isCollapsingPostEmailBlock}
                      onPress={resetToEmailStep}
                    >
                      <PencilSimple size={18} weight="bold" aria-hidden />
                    </Button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>

          <div
            className={`grid min-h-0 transition-[grid-template-rows] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              isPostEmailBlockOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
            style={{ transitionDuration: `${String(expandDurationMs)}ms` }}
            onTransitionEnd={handlePostEmailBlockTransitionEnd}
          >
            {/* Vertical padding only — horizontal padding misaligns vs email and gets clipped by overflow-hidden. */}
            <div
              className={`min-h-0 py-1.5 ${
                isCollapsingPostEmailBlock ? 'overflow-hidden' : 'overflow-visible'
              }`}
            >
              <div className="flex w-full flex-col gap-5 overflow-visible">
                {postEmailStep ? (
                  <>
                    <div role="separator" aria-hidden className="border-border border-t" />
                    <div
                      className={`relative w-full overflow-visible ${
                        step === 'magic_link_sent' ? 'min-h-0' : 'min-h-[8.75rem]'
                      }`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {step === 'magic_link_sent' ? (
                          <motion.div
                            key="magic-link-sent"
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                            transition={motionTransition}
                            className="flex flex-col gap-3"
                          >
                            <p className="text-muted text-sm leading-relaxed">
                              {t('identifyNotice')}
                            </p>
                            {adminMagicLinkReady && env.NEXT_PUBLIC_API_MOCKING === 'enabled' ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Chip
                                  size="sm"
                                  variant="secondary"
                                  className="text-muted uppercase"
                                >
                                  {t('devFeatureLabel')}
                                </Chip>
                                <button
                                  type="button"
                                  onClick={openAdminMagicLink}
                                  className={cn(
                                    navigationLinkClassName('sm'),
                                    'inline-flex items-center gap-0.5 border-0 bg-transparent p-0'
                                  )}
                                >
                                  {t('devAdminMagicLink')}
                                  <CaretRight size={14} weight="bold" aria-hidden />
                                </button>
                              </div>
                            ) : null}
                          </motion.div>
                        ) : null}

                        {step === 'password' ? (
                          <motion.div
                            key="password-fields"
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, x: -stepSlideOffset }}
                            transition={motionTransition}
                            className="flex w-full flex-col gap-5 overflow-visible"
                          >
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="password" isInvalid={passwordInvalid}>
                                {t('password')}
                              </Label>
                              <InputGroup
                                variant="secondary"
                                fullWidth
                                className="overflow-visible"
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
                                    aria-label={
                                      showPassword ? t('hidePassword') : t('showPassword')
                                    }
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
                            initial={reduceMotion ? false : { opacity: 0, x: stepSlideOffset }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, x: -stepSlideOffset }}
                            transition={motionTransition}
                            className="flex w-full flex-col gap-1.5 overflow-visible"
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.div
                                key={useRecoveryCode ? 'recovery' : 'authenticator'}
                                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                                transition={motionTransition}
                                className="flex flex-col gap-1.5 overflow-visible"
                              >
                                <Label htmlFor={TOTP_INPUT_ID} isInvalid={totpInvalid}>
                                  {useRecoveryCode
                                    ? t('recoveryCodeBody')
                                    : twoFactorSetupRequired
                                      ? t('twoFactorSetupBody')
                                      : t('twoFactorVerifyBody')}
                                </Label>
                                {useRecoveryCode ? (
                                  <Input
                                    id={TOTP_INPUT_ID}
                                    variant="secondary"
                                    autoComplete="one-time-code"
                                    spellCheck={false}
                                    placeholder={t('recoveryCodePlaceholder')}
                                    aria-invalid={totpInvalid}
                                    fullWidth
                                    value={recoveryCode}
                                    onChange={(event) => {
                                      setRecoveryCode(event.target.value);
                                      if (authFailed) setAuthFailed(false);
                                    }}
                                  />
                                ) : (
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
                                )}
                              </motion.div>
                            </AnimatePresence>
                            {requiresTwoFactor ? (
                              <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                  key={useRecoveryCode ? 'link-authenticator' : 'link-recovery'}
                                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                                  transition={motionTransition}
                                >
                                  <NavigationLink
                                    chevron="none"
                                    size="sm"
                                    className="mt-1 bg-[repeating-linear-gradient(90deg,currentColor_0_1px,transparent_1px_4px)] bg-[length:4px_1px] bg-[position:0_100%] bg-repeat-x pb-px no-underline"
                                    onPress={() => {
                                      setUseRecoveryCode((active) => !active);
                                      setAuthFailed(false);
                                      setTotpCode('');
                                      setRecoveryCode('');
                                      requestAnimationFrame(() => {
                                        document.getElementById(TOTP_INPUT_ID)?.focus();
                                      });
                                    }}
                                  >
                                    {useRecoveryCode
                                      ? t('useAuthenticatorCode')
                                      : t('useRecoveryCode')}
                                  </NavigationLink>
                                </motion.div>
                              </AnimatePresence>
                            ) : null}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {step === 'magic_link_sent' ? null : (
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
                  : login.isPending ||
                    (useRecoveryCode ? recoveryCode.trim().length === 0 : totpCode.length !== 6)
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
        )}
      </form>
      <TwoFactorProactiveOffer
        open={twoFactorProactiveOpen}
        accountEmail={email}
        onFinished={() => {
          setTwoFactorProactiveOpen(false);
          startTransition(() => {
            router.push(returnTo);
          });
        }}
      />
    </>
  );
}
