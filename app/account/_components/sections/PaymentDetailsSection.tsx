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
  country: '',
  vatId: '',
  billingEmail: '',
};

export function PaymentDetailsSection() {
  const t = useTranslations('account.paymentDetails');
  const tRoot = useTranslations();
  const billing = useBillingAddress();
  const update = useUpdateBillingAddress();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BillingAddress>({
    resolver: zodResolver(billingAddressSchema),
    values: billing.data ?? EMPTY_BILLING,
  });

  function onSubmit(values: BillingAddress) {
    update.mutate(values, {
      onSuccess: (saved) => {
        toast.success(t('addressUpdated'));
        reset(saved);
      },
    });
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
        <AccountSection title={t('addressesTitle')} className="gap-6" contentClassName="gap-6">
          <p className="text-muted text-sm leading-relaxed">{t('aboutIntro')}</p>

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

            <Field id="billingLine1" label={t('line1')} error={err('line1')}>
              <Input id="billingLine1" variant="secondary" fullWidth {...register('line1')} />
            </Field>

            <Field id="billingLine2" label={t('line2')} error={err('line2')}>
              <Input id="billingLine2" variant="secondary" fullWidth {...register('line2')} />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="billingPostalCode" label={t('postalCode')} error={err('postalCode')}>
                <Input
                  id="billingPostalCode"
                  variant="secondary"
                  fullWidth
                  {...register('postalCode')}
                />
              </Field>
              <Field id="billingCity" label={t('city')} error={err('city')}>
                <Input id="billingCity" variant="secondary" fullWidth {...register('city')} />
              </Field>
            </div>

            <Field id="billingCountry" label={t('country')} error={err('country')}>
              <Input id="billingCountry" variant="secondary" fullWidth {...register('country')} />
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
