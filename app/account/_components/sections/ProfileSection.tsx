'use client';

import { useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { setLocale } from '@/app/actions/locale';
import { locales, type Locale } from '@/i18n/config';
import { ApiError } from '@/api/client';
import {
  passwordChangeSchema,
  profileSchema,
  useChangePassword,
  useProfile,
  useUpdateProfile,
  type PasswordChange,
  type Profile,
} from '@/api/account';
import {
  Button,
  Input,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  cn,
  useOverlayState,
} from '@/components/ui';
import { StatusPill } from '@/components/shared/StatusPill';
import { DataState, AccountSection } from '../account-ui';

const profileFormSchema = profileSchema.omit({ role: true, twoFactorEnabled: true });
type ProfileFormValues = z.infer<typeof profileFormSchema>;

type OverlayState = ReturnType<typeof useOverlayState>;

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-danger text-xs">{error}</p> : null}
    </div>
  );
}

function ChangePasswordDialog({ state }: { state: OverlayState }) {
  const t = useTranslations('account.accountDetails');
  const tRoot = useTranslations();
  const change = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordChange>({
    resolver: zodResolver(passwordChangeSchema),
  });

  function onSubmit(values: PasswordChange) {
    change.mutate(values, {
      onSuccess: () => {
        toast.success(t('passwordSaved'));
        reset();
        state.close();
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          setError('currentPassword', { message: t('passwordError') });
          return;
        }
        setError('root', { message: t('passwordError') });
      },
    });
  }

  const err = (key: keyof PasswordChange) => {
    const message = errors[key]?.message;
    if (!message) return undefined;
    return message.startsWith('validation.') ? tRoot(message) : message;
  };

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('passwordTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <Field
                  id="currentPassword"
                  label={t('currentPassword')}
                  error={err('currentPassword')}
                >
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    variant="secondary"
                    fullWidth
                    {...register('currentPassword')}
                  />
                </Field>
                <Field id="newPassword" label={t('newPassword')} error={err('newPassword')}>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    variant="secondary"
                    fullWidth
                    {...register('newPassword')}
                  />
                </Field>
                <Field
                  id="confirmPassword"
                  label={t('confirmPassword')}
                  error={err('confirmPassword')}
                >
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    variant="secondary"
                    fullWidth
                    {...register('confirmPassword')}
                  />
                </Field>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  reset();
                  state.close();
                }}
              >
                {t('dialogCancel')}
              </Button>
              <Button
                variant="primary"
                isDisabled={change.isPending}
                onPress={() => {
                  void handleSubmit(onSubmit)();
                }}
              >
                {t('savePassword')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}

function PersonalDetailsForm({ profile }: { profile: Profile }) {
  const t = useTranslations('account.accountDetails');
  const tRoot = useTranslations();
  const update = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      email: profile.email,
      newsletterOptIn: profile.newsletterOptIn,
    },
  });

  function onSubmit(values: ProfileFormValues) {
    update.mutate(
      {
        ...values,
        displayName: `${values.firstName} ${values.lastName}`.trim(),
        role: profile.role,
        twoFactorEnabled: profile.twoFactorEnabled,
      },
      {
        onSuccess: (saved) => {
          toast.success(t('profileSaved'));
          reset(saved);
        },
      }
    );
  }

  const err = (key: keyof ProfileFormValues) => {
    const message = errors[key]?.message;
    return message ? tRoot(message) : undefined;
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)();
      }}
      noValidate
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="profileFirstName" label={t('firstName')} error={err('firstName')}>
          <Input
            id="profileFirstName"
            variant="secondary"
            fullWidth
            autoComplete="given-name"
            {...register('firstName')}
          />
        </Field>
        <Field id="profileLastName" label={t('lastName')} error={err('lastName')}>
          <Input
            id="profileLastName"
            variant="secondary"
            fullWidth
            autoComplete="family-name"
            {...register('lastName')}
          />
        </Field>
      </div>

      <Field id="profileEmail" label={t('email')} error={err('email')}>
        <Input
          id="profileEmail"
          type="email"
          variant="secondary"
          fullWidth
          autoComplete="email"
          {...register('email')}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="md" isDisabled={!isDirty || update.isPending}>
          {t('dialogSave')}
        </Button>
      </div>
    </form>
  );
}

function LanguagePreference() {
  const t = useTranslations('account.accountDetails');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function selectLocale(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-foreground text-sm font-medium">{t('languageTitle')}</p>
        <p className="text-muted text-sm">{t('languageDescription')}</p>
      </div>
      <div
        role="group"
        aria-label={t('languageTitle')}
        className="border-border inline-flex shrink-0 items-center gap-1 rounded-full border p-1"
      >
        {locales.map((code) => {
          const isActive = code === locale;
          return (
            <button
              key={code}
              type="button"
              disabled={pending}
              aria-pressed={isActive}
              onClick={() => {
                selectLocale(code);
              }}
              className={cn(
                'font-display cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground hover:bg-key-50'
              )}
            >
              {t(`languageNames.${code}` as 'languageNames.de')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SecuritySection({ profile }: { profile: Profile }) {
  const t = useTranslations('account.accountDetails');
  const passwordDialog = useOverlayState();

  if (profile.role === 'admin') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted text-sm leading-relaxed">{t('adminTwoFactorHint')}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-sm font-medium">{t('twoFactorTitle')}</p>
            <p className="text-muted text-sm">{t('twoFactorDescription')}</p>
          </div>
          <StatusPill tone="success">{t('twoFactorEnabled')}</StatusPill>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm leading-relaxed">{t('memberPasswordHint')}</p>
      <div>
        <Button
          variant="outline"
          size="sm"
          onPress={() => {
            passwordDialog.open();
          }}
        >
          {t('changePassword')}
        </Button>
      </div>
      <ChangePasswordDialog state={passwordDialog} />
    </div>
  );
}

export function ProfileSection() {
  const t = useTranslations('account.accountDetails');
  const profile = useProfile();

  return (
    <div className="divide-border flex min-h-0 flex-1 flex-col divide-y">
      <DataState
        isLoading={profile.isLoading}
        isError={profile.isError}
        onRetry={() => void profile.refetch()}
      >
        {profile.data ? (
          <>
            <AccountSection title={t('profileTitle')} className="gap-6" contentClassName="gap-6">
              <p className="text-muted text-sm leading-relaxed">{t('aboutIntro')}</p>
              <PersonalDetailsForm profile={profile.data} />
            </AccountSection>

            <AccountSection title={t('settingsTitle')} className="gap-6" contentClassName="gap-6">
              <LanguagePreference />
              <div className="border-border border-t pt-6">
                <SecuritySection profile={profile.data} />
              </div>
            </AccountSection>
          </>
        ) : null}
      </DataState>
    </div>
  );
}
