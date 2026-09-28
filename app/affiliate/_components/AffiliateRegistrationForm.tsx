'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  createAffiliateRegistrationFormSchema,
  useCreateAffiliateRegistration,
  type AffiliateRegistrationForm as AffiliateFormValues,
} from '@/api/affiliate';
import { Field } from '@/app/result/ui/FormSection';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { newsletterMembershipInputClassName } from '@/components/shared/newsletter-membership-input';
import { AFFILIATE_TERMS_HREF } from '@/lib/affiliate-links';
import {
  Button,
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  CheckCircle,
  Input,
  TextArea,
} from '@/components/ui';
import { FieldErrorText } from '@/components/shared/FieldErrorText';

const SUCCESS_ICON_SURFACE = 'color-mix(in srgb, var(--accent) 8%, transparent)';

/** Keeps the terms link clickable without toggling the checkbox around it. */
function stopCheckboxActivation(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function AffiliateRegistrationForm() {
  const t = useTranslations('affiliatePage.registration');
  const tv = useTranslations('validation');
  const [submitted, setSubmitted] = useState(false);
  const createRegistration = useCreateAffiliateRegistration();

  const schema = useMemo(() => createAffiliateRegistrationFormSchema(tv), [tv]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AffiliateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      paymentEmail: '',
      websiteUrl: '',
      promotion: '',
      acceptTerms: false,
    },
  });

  async function onSubmit(values: AffiliateFormValues) {
    await createRegistration.mutateAsync({
      name: values.name,
      username: values.username,
      email: values.email,
      paymentEmail: values.paymentEmail,
      websiteUrl: values.websiteUrl,
      promotion: values.promotion,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="membership-soft-panel flex w-full flex-col items-center justify-center gap-4 py-6 text-center sm:py-8"
        role="status"
      >
        <div
          className="squircle flex size-12 shrink-0 items-center justify-center"
          style={{ background: SUCCESS_ICON_SURFACE }}
        >
          <CheckCircle size={24} weight="fill" style={{ color: 'var(--accent)' }} aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-base font-semibold">{t('successTitle')}</p>
          <p className="text-muted text-sm leading-relaxed">{t('successBody')}</p>
        </div>
      </div>
    );
  }

  const isBusy = isSubmitting || createRegistration.isPending;

  return (
    <form
      className="membership-soft-panel flex w-full flex-col gap-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-5">
        <Field label={t('nameLabel')} htmlFor="affiliate-name">
          <Input
            id="affiliate-name"
            variant="secondary"
            fullWidth
            className={newsletterMembershipInputClassName}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          <FieldErrorText message={errors.name?.message} />
        </Field>

        <Field
          label={t('usernameLabel')}
          htmlFor="affiliate-username"
          hint={t('usernameHint')}
          hintClassName="text-muted"
        >
          <Input
            id="affiliate-username"
            variant="secondary"
            fullWidth
            className={newsletterMembershipInputClassName}
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            {...register('username')}
          />
          <FieldErrorText message={errors.username?.message} />
        </Field>

        <Field label={t('emailLabel')} htmlFor="affiliate-email">
          <Input
            id="affiliate-email"
            variant="secondary"
            type="email"
            fullWidth
            className={newsletterMembershipInputClassName}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          <FieldErrorText message={errors.email?.message} />
        </Field>

        <Field
          label={t('paymentEmailLabel')}
          htmlFor="affiliate-payment-email"
          hint={t('paymentEmailHint')}
          hintClassName="text-muted"
        >
          <Input
            id="affiliate-payment-email"
            variant="secondary"
            type="email"
            fullWidth
            className={newsletterMembershipInputClassName}
            aria-invalid={Boolean(errors.paymentEmail)}
            {...register('paymentEmail')}
          />
          <FieldErrorText message={errors.paymentEmail?.message} />
        </Field>

        <Field label={t('websiteLabel')} htmlFor="affiliate-website">
          <Input
            id="affiliate-website"
            variant="secondary"
            type="url"
            fullWidth
            className={newsletterMembershipInputClassName}
            autoComplete="url"
            placeholder={t('optionalPlaceholder')}
            aria-invalid={Boolean(errors.websiteUrl)}
            {...register('websiteUrl')}
          />
          <FieldErrorText message={errors.websiteUrl?.message} />
        </Field>

        <Field label={t('promotionLabel')} htmlFor="affiliate-promotion">
          <TextArea
            id="affiliate-promotion"
            variant="secondary"
            rows={4}
            fullWidth
            className={newsletterMembershipInputClassName}
            aria-invalid={Boolean(errors.promotion)}
            {...register('promotion')}
          />
          <FieldErrorText message={errors.promotion?.message} />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <Checkbox
              variant="secondary"
              className="items-start"
              isSelected={field.value}
              onChange={field.onChange}
              aria-invalid={Boolean(errors.acceptTerms)}
            >
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
              <CheckboxContent>
                <span className="text-sm leading-snug">
                  {t.rich('acceptTerms', {
                    terms: (chunks) => (
                      <NavigationLink
                        href={AFFILIATE_TERMS_HREF}
                        target="_blank"
                        chevron="none"
                        size="sm"
                        className="inline align-baseline"
                        onClick={stopCheckboxActivation}
                        onPointerDown={stopCheckboxActivation}
                      >
                        {chunks}
                      </NavigationLink>
                    ),
                  })}
                </span>
              </CheckboxContent>
            </Checkbox>
          )}
        />
        <FieldErrorText message={errors.acceptTerms?.message} />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isDisabled={isBusy}
        className="font-display h-14 w-full gap-2 rounded-full text-base"
      >
        {isBusy ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
