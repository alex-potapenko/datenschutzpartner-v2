'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AFFILIATE_PAYOUT_CADENCES,
  affiliateProgramSettingsFormSchema,
  useAffiliateProgramSettings,
  useUpdateAffiliateProgramSettings,
  type AffiliateProgramSettings,
  type AffiliateProgramSettingsForm,
} from '@/api/affiliate';
import { Field } from '@/app/result/ui/FormSection';
import { FieldErrorText } from '@/components/shared/FieldErrorText';
import { Button, Input, ListBox, Select } from '@/components/ui';
import { AccountSection, DataState } from '@/app/account/_components/account-ui';

function toForm(settings: AffiliateProgramSettings): AffiliateProgramSettingsForm {
  return {
    commissionPercent: Math.round(settings.defaultCommissionRate * 1000) / 10,
    cookieDays: settings.cookieDays,
    payoutThresholdChf: settings.payoutThresholdChf,
    payoutCadenceMonths: settings.payoutCadenceMonths,
  };
}

function SettingsForm({ settings }: { settings: AffiliateProgramSettings }) {
  const t = useTranslations('account.affiliateAdmin.settings');
  const tRoot = useTranslations();
  const update = useUpdateAffiliateProgramSettings();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AffiliateProgramSettingsForm>({
    resolver: zodResolver(affiliateProgramSettingsFormSchema),
    values: toForm(settings),
  });

  function onSubmit(values: AffiliateProgramSettingsForm) {
    update.mutate(
      {
        defaultCommissionRate: values.commissionPercent / 100,
        cookieDays: values.cookieDays,
        payoutThresholdChf: values.payoutThresholdChf,
        payoutCadenceMonths: values.payoutCadenceMonths,
      },
      {
        onSuccess: (saved) => {
          toast.success(t('saved'));
          reset(toForm(saved));
        },
        onError: () => {
          toast.error(t('saveFailed'));
        },
      }
    );
  }

  const errorText = (message: string | undefined) => (message ? tRoot(message) : undefined);

  return (
    <form
      className="flex max-w-xl flex-col gap-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)();
      }}
    >
      <Field
        label={t('rateLabel')}
        htmlFor="affiliate-settings-rate"
        hint={t('rateHint')}
        hintClassName="text-muted"
      >
        <div className="flex w-40 items-center gap-2">
          <Input
            id="affiliate-settings-rate"
            type="number"
            inputMode="decimal"
            step="0.5"
            variant="secondary"
            fullWidth
            aria-invalid={Boolean(errors.commissionPercent)}
            {...register('commissionPercent', { valueAsNumber: true })}
          />
          <span className="text-muted text-sm">%</span>
        </div>
        <FieldErrorText message={errorText(errors.commissionPercent?.message)} />
      </Field>

      <Field
        label={t('cookieLabel')}
        htmlFor="affiliate-settings-cookie"
        hint={t('cookieHint')}
        hintClassName="text-muted"
      >
        <div className="flex w-40 items-center gap-2">
          <Input
            id="affiliate-settings-cookie"
            type="number"
            inputMode="numeric"
            variant="secondary"
            fullWidth
            aria-invalid={Boolean(errors.cookieDays)}
            {...register('cookieDays', { valueAsNumber: true })}
          />
          <span className="text-muted text-sm">{t('days')}</span>
        </div>
        <FieldErrorText message={errorText(errors.cookieDays?.message)} />
      </Field>

      <Field
        label={t('thresholdLabel')}
        htmlFor="affiliate-settings-threshold"
        hint={t('thresholdHint')}
        hintClassName="text-muted"
      >
        <div className="flex w-40 items-center gap-2">
          <span className="text-muted text-sm">CHF</span>
          <Input
            id="affiliate-settings-threshold"
            type="number"
            inputMode="decimal"
            variant="secondary"
            fullWidth
            aria-invalid={Boolean(errors.payoutThresholdChf)}
            {...register('payoutThresholdChf', { valueAsNumber: true })}
          />
        </div>
        <FieldErrorText message={errorText(errors.payoutThresholdChf?.message)} />
      </Field>

      <Field
        label={t('cadenceLabel')}
        htmlFor="affiliate-settings-cadence"
        hint={t('cadenceHint')}
        hintClassName="text-muted"
      >
        <Controller
          name="payoutCadenceMonths"
          control={control}
          render={({ field }) => (
            <Select
              value={String(field.value)}
              onChange={(key) => {
                if (key !== null) field.onChange(Number(key));
              }}
              variant="secondary"
              className="w-56"
              aria-label={t('cadenceLabel')}
            >
              <Select.Trigger id="affiliate-settings-cadence">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {AFFILIATE_PAYOUT_CADENCES.map((months) => (
                    <ListBox.Item
                      key={months}
                      id={String(months)}
                      textValue={t(`cadence.${String(months)}`)}
                    >
                      {t(`cadence.${String(months)}`)}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        />
      </Field>

      <div>
        <Button type="submit" variant="primary" size="md" isDisabled={!isDirty || update.isPending}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}

export function AffiliateAdminSettingsPanel() {
  const t = useTranslations('account.affiliateAdmin.settings');
  const settings = useAffiliateProgramSettings();

  return (
    <DataState
      isLoading={settings.isLoading}
      isError={settings.isError}
      onRetry={() => void settings.refetch()}
    >
      <AccountSection title={t('title')} contentClassName="gap-6">
        <p className="text-muted max-w-2xl text-sm leading-relaxed">{t('body')}</p>
        {settings.data ? <SettingsForm settings={settings.data} /> : null}
      </AccountSection>
    </DataState>
  );
}
