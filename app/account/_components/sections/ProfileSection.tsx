'use client';

import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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
  useOverlayState,
} from '@/components/ui';
import { DataState, AccountSection } from '../account-ui';

type OverlayState = ReturnType<typeof useOverlayState>;

const MASKED_PASSWORD = '••••••••••••';

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

function ProfileDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted text-sm">{label}</p>
      <p className="text-foreground text-sm font-medium">{value}</p>
    </div>
  );
}

function EditProfileDialog({ state, profile }: { state: OverlayState; profile: Profile }) {
  const t = useTranslations('account.accountDetails');
  const tRoot = useTranslations();
  const update = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    values: profile,
  });

  function onSubmit(values: Profile) {
    update.mutate(
      {
        ...values,
        displayName: `${values.firstName} ${values.lastName}`.trim(),
      },
      {
        onSuccess: () => {
          toast.success(t('profileSaved'));
          state.close();
        },
      }
    );
  }

  const err = (key: keyof Profile) => {
    const message = errors[key]?.message;
    return message ? tRoot(message) : undefined;
  };

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('editProfileTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="editFirstName" label={t('firstName')} error={err('firstName')}>
                    <Input
                      id="editFirstName"
                      variant="secondary"
                      fullWidth
                      autoComplete="given-name"
                      {...register('firstName')}
                    />
                  </Field>
                  <Field id="editLastName" label={t('lastName')} error={err('lastName')}>
                    <Input
                      id="editLastName"
                      variant="secondary"
                      fullWidth
                      autoComplete="family-name"
                      {...register('lastName')}
                    />
                  </Field>
                </div>
                <Field id="editEmail" label={t('email')} error={err('email')}>
                  <Input
                    id="editEmail"
                    type="email"
                    variant="secondary"
                    fullWidth
                    autoComplete="email"
                    {...register('email')}
                  />
                </Field>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  reset(profile);
                  state.close();
                }}
              >
                {t('dialogCancel')}
              </Button>
              <Button
                variant="primary"
                isDisabled={update.isPending}
                onPress={() => {
                  void handleSubmit(onSubmit)();
                }}
              >
                {t('dialogSave')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
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

function ProfileDetails({ profile }: { profile: Profile }) {
  const t = useTranslations('account.accountDetails');

  return (
    <div className="flex flex-col gap-4">
      <ProfileDetailRow label={t('firstName')} value={profile.firstName} />
      <ProfileDetailRow label={t('lastName')} value={profile.lastName} />
      <ProfileDetailRow label={t('email')} value={profile.email} />
      <ProfileDetailRow label={t('password')} value={MASKED_PASSWORD} />
    </div>
  );
}

export function ProfileSection() {
  const t = useTranslations('account.accountDetails');
  const profile = useProfile();
  const editDialog = useOverlayState();
  const passwordDialog = useOverlayState();

  return (
    <div className="divide-border flex min-h-0 flex-1 flex-col divide-y">
      <DataState
        isLoading={profile.isLoading}
        isError={profile.isError}
        onRetry={() => void profile.refetch()}
      >
        {profile.data ? (
          <AccountSection
            title={t('profileTitle')}
            className="gap-6"
            contentClassName="gap-6"
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    editDialog.open();
                  }}
                >
                  {t('editProfile')}
                </Button>
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
            }
          >
            <ProfileDetails profile={profile.data} />
            <EditProfileDialog state={editDialog} profile={profile.data} />
            <ChangePasswordDialog state={passwordDialog} />
          </AccountSection>
        ) : null}
      </DataState>
    </div>
  );
}
