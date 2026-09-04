'use client';

import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  billingAddressSchema,
  useBillingAddress,
  useUpdateBillingAddress,
  type BillingAddress,
} from '@/api/account';
import { displayCountryLabel, SWISS_COUNTRY_STORAGE } from '@/lib/swiss-country';
import { PostalAddressFields } from '@/app/result/ui/PostalAddressFields';
import { Button, Input } from '@/components/ui';
import { DataState, AccountSection } from '../account-ui';

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

const EMPTY_BILLING: BillingAddress = {
  firstName: '',
  lastName: '',
  company: '',
  line1: '',
  line2: '',
  postalCode: '',
  city: '',
  country: SWISS_COUNTRY_STORAGE,
  vatId: '',
  billingEmail: '',
};

export function PaymentDetailsSection() {
  const t = useTranslations('account.paymentDetails');
  const tRoot = useTranslations();
  const tCommon = useTranslations('common');
  const billing = useBillingAddress();
  const update = useUpdateBillingAddress();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BillingAddress>({
    resolver: zodResolver(billingAddressSchema),
    values: billing.data
      ? { ...billing.data, country: SWISS_COUNTRY_STORAGE }
      : { ...EMPTY_BILLING, country: SWISS_COUNTRY_STORAGE },
  });

  function onSubmit(values: BillingAddress) {
    update.mutate(
      { ...values, country: SWISS_COUNTRY_STORAGE },
      {
        onSuccess: (saved) => {
          toast.success(t('addressUpdated'));
          reset({ ...saved, country: SWISS_COUNTRY_STORAGE });
        },
      }
    );
  }

  const err = (key: keyof BillingAddress) => {
    const message = errors[key]?.message;
    return message ? tRoot(message) : undefined;
  };

  return (
    <div className="divide-border flex min-h-0 flex-1 flex-col divide-y">
      <DataState
        isLoading={billing.isLoading}
        isError={billing.isError}
        onRetry={() => void billing.refetch()}
      >
        <AccountSection className="gap-6" contentClassName="gap-6">
          <p className="text-foreground text-base leading-relaxed">{t('aboutIntro')}</p>
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit(onSubmit)();
            }}
            noValidate
          >
            <Field id="billingEmail" label={t('billingEmail')} error={err('billingEmail')}>
              <Input
                id="billingEmail"
                type="email"
                variant="secondary"
                fullWidth
                autoComplete="email"
                {...register('billingEmail')}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="billingFirstName" label={t('firstName')} error={err('firstName')}>
                <Input
                  id="billingFirstName"
                  variant="secondary"
                  fullWidth
                  autoComplete="given-name"
                  {...register('firstName')}
                />
              </Field>
              <Field id="billingLastName" label={t('lastName')} error={err('lastName')}>
                <Input
                  id="billingLastName"
                  variant="secondary"
                  fullWidth
                  autoComplete="family-name"
                  {...register('lastName')}
                />
              </Field>
            </div>

            <Field id="billingCompany" label={t('company')} error={err('company')}>
              <Input id="billingCompany" variant="secondary" fullWidth {...register('company')} />
            </Field>

            <PostalAddressFields
              idPrefix="billing"
              street={watch('line1')}
              streetLine2={watch('line2')}
              postalCode={watch('postalCode')}
              city={watch('city')}
              onStreetChange={(value) => {
                setValue('line1', value, { shouldDirty: true, shouldValidate: true });
              }}
              onStreetLine2Change={(value) => {
                setValue('line2', value, { shouldDirty: true, shouldValidate: true });
              }}
              onPostalCodeChange={(value) => {
                setValue('postalCode', value, { shouldDirty: true, shouldValidate: true });
              }}
              onCityChange={(value) => {
                setValue('city', value, { shouldDirty: true, shouldValidate: true });
              }}
              line1Error={err('line1') ?? err('postalCode') ?? err('city')}
              streetLine2Error={err('line2')}
            />

            <Field id="billingCountry" label={t('country')}>
              <p className="text-foreground text-sm leading-relaxed">
                {tCommon('countrySwitzerland')}
              </p>
            </Field>

            <Field id="billingVatId" label={t('vatId')} error={err('vatId')}>
              <Input id="billingVatId" variant="secondary" fullWidth {...register('vatId')} />
            </Field>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isDisabled={!isDirty || update.isPending}
              >
                {t('save')}
              </Button>
            </div>
          </form>
        </AccountSection>
      </DataState>
    </div>
  );
}
