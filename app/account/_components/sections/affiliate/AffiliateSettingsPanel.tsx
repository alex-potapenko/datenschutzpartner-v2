'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  affiliatePartnerSettingsUpdateSchema,
  isAffiliatePartnerEditable,
  useUpdateAffiliatePartnerSettings,
  type AffiliatePartner,
  type AffiliatePartnerSettingsUpdate,
} from '@/api/affiliate';
import { Field } from '@/app/result/ui/FormSection';
import { FieldErrorText } from '@/components/shared/FieldErrorText';
import {
  Button,
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  Input,
} from '@/components/ui';
import { AffiliateQuitProgramLink } from '@/components/shared/affiliate/AffiliateQuitProgramLink';
import { AccountSection } from '../../account-ui';

export function AffiliateSettingsPanel({ partner }: { partner: AffiliatePartner }) {
  const t = useTranslations('account.affiliate.settings');
  const tRoot = useTranslations();
  const update = useUpdateAffiliatePartnerSettings();
  const canEdit = isAffiliatePartnerEditable(partner);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AffiliatePartnerSettingsUpdate>({
    resolver: zodResolver(affiliatePartnerSettingsUpdateSchema),
    values: {
      notificationEmail: partner.notificationEmail,
      notifyOnReferral: partner.notifyOnReferral,
    },
  });

  function onSubmit(values: AffiliatePartnerSettingsUpdate) {
    update.mutate(values, {
      onSuccess: (saved) => {
        toast.success(t('saved'));
        reset({
          notificationEmail: saved.notificationEmail,
          notifyOnReferral: saved.notifyOnReferral,
        });
      },
      onError: () => {
        toast.error(t('saveFailed'));
      },
    });
  }

  const emailError = errors.notificationEmail?.message;

  return (
    <div className="divide-border flex min-w-0 flex-1 flex-col divide-y">
      <AccountSection title={t('title')} contentClassName="gap-6">
        <form
          className="flex max-w-xl flex-col gap-6"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(onSubmit)();
          }}
        >
          <Field label={t('emailLabel')} htmlFor="affiliate-notification-email">
            <Input
              id="affiliate-notification-email"
              type="email"
              variant="secondary"
              fullWidth
              autoComplete="email"
              aria-invalid={Boolean(emailError)}
              isReadOnly={!canEdit}
              {...register('notificationEmail')}
            />
            <FieldErrorText message={emailError ? tRoot(emailError) : undefined} />
          </Field>

          <Controller
            name="notifyOnReferral"
            control={control}
            render={({ field }) => (
              <Checkbox
                variant="secondary"
                className="items-center gap-2"
                isSelected={field.value}
                isDisabled={!canEdit}
                onChange={field.onChange}
              >
                <CheckboxControl>
                  <CheckboxIndicator />
                </CheckboxControl>
                <CheckboxContent>
                  <span className="text-foreground text-sm leading-snug">{t('notifyLabel')}</span>
                </CheckboxContent>
              </Checkbox>
            )}
          />

          {canEdit ? (
            <div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isDisabled={!isDirty || update.isPending}
              >
                {t('save')}
              </Button>
            </div>
          ) : null}
        </form>
      </AccountSection>

      {canEdit ? (
        <AccountSection title={t('leaveTitle')} contentClassName="gap-6">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-foreground m-0 text-sm leading-relaxed">{t('leaveBody')}</p>
            <div>
              <AffiliateQuitProgramLink label={t('leave')} className="inline-flex" />
            </div>
          </div>
        </AccountSection>
      ) : null}
    </div>
  );
}
