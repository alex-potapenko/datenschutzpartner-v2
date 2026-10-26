'use client';

import { useState, useTransition, type ReactNode } from 'react';
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
  type MemberSignInMethod,
  type PasswordChange,
  type Profile,
} from '@/api/account';
import {
  invalidateTwoFactorQueries,
  useRegenerateRecoveryCodes,
  useStartTwoFactorSetup,
  useTwoFactorStatus,
} from '@/api/two-factor';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  Input,
  Label,
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
import { TotpInput } from '@/components/shared/TotpInput';
import { EnableTwoFactorDialog, RecoveryCodesPanel } from '@/components/shared/two-factor';
import { AnimatedDirectionalPanel } from '../AnimatedDirectionalPanel';
import { DataState, AccountSection } from '../account-ui';
import { FieldErrorText } from '@/components/shared/FieldErrorText';

const profileFormSchema = profileSchema.omit({
  role: true,
  memberSignInMethod: true,
  twoFactorEnabled: true,
});
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
      <FieldErrorText message={error} />
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
    <div
      role="group"
      aria-label={t('languageTitle')}
      className="border-border inline-flex w-fit items-center gap-1 rounded-full border p-1"
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
              'font-display cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
              isActive ? 'bg-accent text-white' : 'text-muted hover:text-foreground hover:bg-key-50'
            )}
          >
            {t(`languageNames.${code}` as 'languageNames.de')}
          </button>
        );
      })}
    </div>
  );
}

const REGENERATE_RECOVERY_CODES_FORM_ID = 'regenerate-recovery-codes-form';

function RegenerateRecoveryCodesDialog({
  state,
  accountName,
}: {
  state: OverlayState;
  accountName: string;
}) {
  const t = useTranslations('twoFactor');
  const queryClient = useQueryClient();
  const regenerate = useRegenerateRecoveryCodes();
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [codeInvalid, setCodeInvalid] = useState(false);

  function resetForm() {
    setCode('');
    setCodes([]);
    setCodeInvalid(false);
  }

  function close() {
    resetForm();
    state.close();
  }

  function submitCode() {
    if (code.length !== 6 || regenerate.isPending) {
      return;
    }

    regenerate.mutate(
      { code },
      {
        onSuccess: (result) => {
          setCodes(result.recoveryCodes);
          toast.success(t('regenerateSuccess'));
        },
        onError: () => {
          setCodeInvalid(true);
        },
      }
    );
  }

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable={codes.length === 0}>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('regenerateTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              {codes.length > 0 ? (
                <RecoveryCodesPanel
                  codes={codes}
                  accountName={accountName}
                  confirmLabel={t('recoveryDone')}
                  onConfirm={() => {
                    invalidateTwoFactorQueries(queryClient);
                    close();
                  }}
                />
              ) : (
                <form
                  id={REGENERATE_RECOVERY_CODES_FORM_ID}
                  className="flex flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitCode();
                  }}
                >
                  <p className="text-foreground text-sm leading-relaxed">{t('regenerateBody')}</p>
                  <TotpInput
                    aria-label={t('codeLabel')}
                    value={code}
                    isInvalid={codeInvalid}
                    isDisabled={regenerate.isPending}
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- confirm regeneration with OTP
                    autoFocus
                    onChange={(value) => {
                      setCode(value);
                      setCodeInvalid(false);
                    }}
                  />
                  <FieldErrorText message={codeInvalid ? t('codeInvalid') : undefined} />
                </form>
              )}
            </ModalBody>
            {codes.length === 0 ? (
              <ModalFooter>
                <Button variant="outline" onPress={close}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  form={REGENERATE_RECOVERY_CODES_FORM_ID}
                  isDisabled={code.length !== 6 || regenerate.isPending}
                  isPending={regenerate.isPending}
                >
                  {t('regenerateConfirmCta')}
                </Button>
              </ModalFooter>
            ) : null}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}

function TwoFactorSectionActions({
  profile,
  onOpenRegenerate,
}: {
  profile: Profile;
  onOpenRegenerate: () => void;
}) {
  const t = useTranslations('twoFactor');
  const status = useTwoFactorStatus();
  const startSetup = useStartTwoFactorSetup();
  const enableDialog = useOverlayState();

  // Rendering the enable button before the status arrives would flash the
  // wrong state for accounts that already have 2FA.
  if (status.isPending) {
    return null;
  }

  if (!status.data) {
    return null;
  }

  const isEnabled = status.data.enabled;

  return (
    <>
      {isEnabled ? (
        <>
          <p className="text-foreground text-sm leading-relaxed">
            {t('recoveryAvailableLabel')} {status.data.recoveryCodesRemaining}/
            {status.data.recoveryCodesTotal}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="w-fit" onPress={onOpenRegenerate}>
              {t('regenerateCta')}
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          isDisabled={startSetup.isPending}
          onPress={() => {
            // Request the secret up front so the dialog opens with a QR code.
            startSetup.mutate(
              {},
              {
                onSuccess: () => {
                  enableDialog.open();
                },
                onError: () => {
                  toast.error(t('setupFailed'));
                },
              }
            );
          }}
        >
          {t('enableCta')}
        </Button>
      )}

      {/* Mounted regardless of the status: activation flips `enabled` while the
          dialog still has to show the recovery codes. */}
      <EnableTwoFactorDialog
        state={enableDialog}
        accountName={profile.email}
        setup={startSetup.data}
        onClosed={() => {
          startSetup.reset();
        }}
      />
    </>
  );
}

function PasswordSignInSecurityOptions({
  profile,
  twoFactorEnabled,
}: {
  profile: Profile;
  twoFactorEnabled: boolean | undefined;
}) {
  const t = useTranslations('account.accountDetails');
  const regenerateDialog = useOverlayState();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label elementType="p">{t('password')}</Label>
        <SecuritySection />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Label elementType="p">{t('twoFactorTitle')}</Label>
          {twoFactorEnabled ? (
            <Chip variant="secondary" size="sm" color="success" className="w-fit">
              {t('twoFactorEnabled')}
            </Chip>
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <TwoFactorSectionActions
            profile={profile}
            onOpenRegenerate={() => {
              regenerateDialog.open();
            }}
          />
        </div>
      </div>
      <RegenerateRecoveryCodesDialog state={regenerateDialog} accountName={profile.email} />
    </>
  );
}

function SecuritySection() {
  const t = useTranslations('account.accountDetails');
  const passwordDialog = useOverlayState();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onPress={() => {
          passwordDialog.open();
        }}
      >
        {t('changePassword')}
      </Button>
      <ChangePasswordDialog state={passwordDialog} />
    </>
  );
}

export function ProfileSection() {
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
            <AccountSection className="gap-6" contentClassName="gap-6">
              <PersonalDetailsForm profile={profile.data} />
            </AccountSection>
          </>
        ) : null}
      </DataState>
    </div>
  );
}

export function SettingsSection() {
  const t = useTranslations('account.accountDetails');
  const profile = useProfile();
  const twoFactor = useTwoFactorStatus();

  const activeSignInMethod: MemberSignInMethod = profile.data?.memberSignInMethod ?? 'magic_link';

  return (
    <div className="divide-border flex min-h-0 flex-1 flex-col divide-y">
      <DataState
        isLoading={profile.isLoading}
        isError={profile.isError}
        onRetry={() => void profile.refetch()}
      >
        {profile.data ? (
          <>
            <AccountSection title={t('authentication')} contentClassName="gap-6">
              {profile.data.role === 'member' ? (
                <div className="flex flex-col gap-4">
                  <AnimatedDirectionalPanel
                    activeKey={activeSignInMethod}
                    order={['magic_link', 'password']}
                    axis="y"
                    className="flex flex-col gap-6"
                  >
                    {activeSignInMethod === 'magic_link' ? (
                      <p className="text-foreground text-sm leading-relaxed font-normal">
                        {t('signInMethodMagicLinkDescription')}
                      </p>
                    ) : (
                      <PasswordSignInSecurityOptions
                        profile={profile.data}
                        twoFactorEnabled={twoFactor.data?.enabled}
                      />
                    )}
                  </AnimatedDirectionalPanel>
                </div>
              ) : (
                <PasswordSignInSecurityOptions
                  profile={profile.data}
                  twoFactorEnabled={twoFactor.data?.enabled}
                />
              )}
            </AccountSection>
            <AccountSection title={t('languageTitle')} contentClassName="gap-0">
              <LanguagePreference />
            </AccountSection>
          </>
        ) : null}
      </DataState>
    </div>
  );
}
