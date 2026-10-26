'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  setPasswordSchema,
  useCompleteInvite,
  useInviteValidation,
  type SetPasswordInput,
} from '@/api/auth';
import { useActivateTwoFactor, useStartTwoFactorSetup } from '@/api/two-factor';
import { showDangerToast } from '@/components/shared/dangerToast';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { RecoveryCodesPanel, TwoFactorSetupPanel } from '@/components/shared/two-factor';
import { ScanLoader } from '@/components/shared/ScanLoader';
import { Button, Input, Label } from '@/components/ui';
import { FieldErrorText } from '@/components/shared/FieldErrorText';

type Step = 'password' | 'intro' | 'two-factor' | 'recovery';

/**
 * The e-mail setup link: choose a password and configure two-factor
 * authentication before the account gets its first session. Admin accounts
 * cannot skip the second step — the backend rejects completion without it.
 */
export function SetPasswordApp() {
  const t = useTranslations('setPassword');
  const tTwoFactor = useTranslations('twoFactor');
  const tv = useTranslations('validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const invite = useInviteValidation(token);
  const startSetup = useStartTwoFactorSetup();
  const activate = useActivateTwoFactor();
  const complete = useCompleteInvite();

  const [step, setStep] = useState<Step | null>(null);
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codeInvalid, setCodeInvalid] = useState(false);

  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Derived rather than synced in an effect: the first step depends only on
  // what the invite says.
  const currentStep: Step = step ?? (invite.data?.needsPassword ? 'password' : 'intro');

  function finish() {
    complete.mutate(
      { token, password: password || undefined },
      {
        onSuccess: () => {
          toast.success(t('success'));
          router.replace('/account');
        },
        onError: () => {
          showDangerToast(t('completeFailed'));
        },
      }
    );
  }

  function beginTwoFactorSetup() {
    startSetup.mutate(
      { setupToken: token },
      {
        onSuccess: () => {
          setStep('two-factor');
        },
        onError: () => {
          showDangerToast(tTwoFactor('setupFailed'));
        },
      }
    );
  }

  function onPasswordSubmit(values: SetPasswordInput) {
    setPassword(values.password);

    if (invite.data?.twoFactorRequired || !invite.data?.twoFactorEnabled) {
      beginTwoFactorSetup();
      return;
    }

    finish();
  }

  if (!token) {
    return <Notice title={t('title')} body={t('missingToken')} />;
  }

  if (invite.isLoading) {
    return (
      <ScanLoader
        layout="center"
        label={t('validating')}
        statusAriaLabel={t('validating')}
        className="py-8"
      />
    );
  }

  if (invite.isError || !invite.data) {
    return <Notice title={t('title')} body={t('invalidToken')} />;
  }

  if (currentStep === 'recovery') {
    return (
      <div className="flex flex-col gap-6">
        <Heading title={tTwoFactor('recoveryTitle')} />
        <RecoveryCodesPanel
          codes={recoveryCodes}
          accountName={invite.data.email}
          confirmLabel={t('finishCta')}
          onConfirm={finish}
        />
      </div>
    );
  }

  if (currentStep === 'two-factor') {
    return (
      <div className="flex flex-col gap-6">
        <Heading title={tTwoFactor('setupTitle')} />
        <TwoFactorSetupPanel
          setup={startSetup.data}
          isVerifying={activate.isPending}
          isInvalid={codeInvalid}
          onSubmit={(code) => {
            setCodeInvalid(false);
            activate.mutate(
              { code, setupToken: token },
              {
                onSuccess: (result) => {
                  setRecoveryCodes(result.recoveryCodes);
                  setStep('recovery');
                },
                onError: () => {
                  setCodeInvalid(true);
                },
              }
            );
          }}
        />
      </div>
    );
  }

  if (currentStep === 'intro') {
    return (
      <div className="flex flex-col gap-6">
        <Heading title={t('twoFactorRequiredTitle')} body={t('twoFactorRequiredBody')} />
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isDisabled={startSetup.isPending}
          onPress={beginTwoFactorSetup}
        >
          {t('startTwoFactorCta')}
        </Button>
      </div>
    );
  }

  const errorMessage = (key: keyof SetPasswordInput) => {
    const message = form.formState.errors[key]?.message;
    if (!message) return undefined;
    return message.startsWith('validation.')
      ? tv(message.replace('validation.', '') as 'required')
      : message;
  };

  return (
    <div className="flex flex-col gap-6">
      <Heading title={t('title')} body={t('body', { email: invite.data.email })} />

      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit(onPasswordSubmit)();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">{t('passwordLabel')}</Label>
          <Input
            id="new-password"
            type="password"
            variant="secondary"
            autoComplete="new-password"
            fullWidth
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
          <FieldErrorText message={errorMessage('password')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">{t('confirmPasswordLabel')}</Label>
          <Input
            id="confirm-password"
            type="password"
            variant="secondary"
            autoComplete="new-password"
            fullWidth
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
            {...form.register('confirmPassword')}
          />
          <FieldErrorText message={errorMessage('confirmPassword')} />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isDisabled={startSetup.isPending || complete.isPending}
        >
          {t('continueCta')}
        </Button>
      </form>
    </div>
  );
}

function Heading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col gap-3 text-center">
      <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{title}</h1>
      {body ? <p className="text-muted text-sm leading-relaxed">{body}</p> : null}
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  const t = useTranslations('setPassword');

  return (
    <div className="flex flex-col gap-4">
      <Heading title={title} body={body} />
      <NavigationLink href="/login/forgot-password" className="self-center">
        {t('requestNewLink')}
      </NavigationLink>
    </div>
  );
}
