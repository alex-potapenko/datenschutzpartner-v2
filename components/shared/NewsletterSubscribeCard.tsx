'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Button, EnvelopeSimple, Input } from '@/components/ui';
import { Field } from '@/app/result/ui/FormSection';
import { NavigationLink } from './NavigationLink';
import { COMPANY_NAME_PATTERN, PERSON_NAME_PATTERN } from '@/lib/validation/patterns';
import { newsletterMembershipInputClassName } from '@/components/shared/newsletter-membership-input';

const newsletterPanelClassName =
  'w-full rounded-2xl bg-white p-4 [box-shadow:var(--shadow-soft-panel)] sm:p-8';

const SUCCESS_ICON_SURFACE = 'color-mix(in srgb, var(--accent) 8%, transparent)';

type NewsletterSubscribeCardProps = {
  /** Renders inside the EU Rep–style membership card (no outer shell). */
  variant?: 'standalone' | 'embedded';
  onSubmittedChange?: (submitted: boolean) => void;
};

type NewsletterFormValues = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
};

function NewsletterSuccessContent({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div
        className="squircle flex size-12 shrink-0 items-center justify-center"
        style={{ background: SUCCESS_ICON_SURFACE }}
      >
        <EnvelopeSimple size={24} weight="fill" style={{ color: 'var(--accent)' }} aria-hidden />
      </div>
      <p className="text-foreground text-base font-semibold">{message}</p>
    </div>
  );
}

export function NewsletterSubscribeCard({
  variant = 'standalone',
  onSubmittedChange,
}: NewsletterSubscribeCardProps) {
  const t = useTranslations('newsletter');
  const tv = useTranslations('validation');
  const optionalPlaceholder = t('optionalPlaceholder');
  const [submitted, setSubmitted] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        firstName: z
          .string()
          .trim()
          .refine((value) => value === '' || PERSON_NAME_PATTERN.test(value), tv('personName')),
        lastName: z
          .string()
          .trim()
          .refine((value) => value === '' || PERSON_NAME_PATTERN.test(value), tv('personName')),
        company: z
          .string()
          .trim()
          .refine((value) => value === '' || COMPANY_NAME_PATTERN.test(value), tv('companyName')),
        email: z.email(tv('email')),
      }),
    [tv]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
    },
  });

  function onSubmit() {
    setSubmitted(true);
    onSubmittedChange?.(true);
  }

  const outerWrapperClassName =
    variant === 'embedded'
      ? 'flex w-full flex-col'
      : 'flex w-full max-w-[440px] flex-col items-center';

  const formClassName = [
    'membership-soft-panel flex w-full flex-col gap-6',
    variant === 'embedded' ? 'relative' : newsletterPanelClassName,
  ]
    .filter(Boolean)
    .join(' ');

  if (submitted && variant === 'standalone') {
    return (
      <div className={outerWrapperClassName}>
        <div
          className={`${newsletterPanelClassName} flex flex-col items-center justify-center gap-4 py-6 text-center sm:py-8`}
        >
          <NewsletterSuccessContent message={t('successMessage')} />
        </div>
        <p className="text-muted text-center text-xs leading-relaxed">{t('legalDataUse')}</p>
      </div>
    );
  }

  return (
    <div className={outerWrapperClassName}>
      <form className={formClassName} noValidate onSubmit={handleSubmit(onSubmit)}>
        <div
          className={['flex flex-col gap-6', submitted ? 'invisible' : '']
            .filter(Boolean)
            .join(' ')}
          aria-hidden={submitted || undefined}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={t('firstNameLabel')}>
              <Input
                variant="secondary"
                fullWidth
                className={newsletterMembershipInputClassName}
                autoComplete="given-name"
                placeholder={optionalPlaceholder}
                aria-invalid={Boolean(errors.firstName)}
                {...register('firstName')}
              />
              {errors.firstName ? (
                <p className="text-danger text-xs">{errors.firstName.message}</p>
              ) : null}
            </Field>

            <Field label={t('lastNameLabel')}>
              <Input
                variant="secondary"
                fullWidth
                className={newsletterMembershipInputClassName}
                autoComplete="family-name"
                placeholder={optionalPlaceholder}
                aria-invalid={Boolean(errors.lastName)}
                {...register('lastName')}
              />
              {errors.lastName ? (
                <p className="text-danger text-xs">{errors.lastName.message}</p>
              ) : null}
            </Field>
          </div>

          <Field label={t('companyLabel')}>
            <Input
              variant="secondary"
              fullWidth
              className={newsletterMembershipInputClassName}
              autoComplete="organization"
              placeholder={optionalPlaceholder}
              aria-invalid={Boolean(errors.company)}
              {...register('company')}
            />
            {errors.company ? (
              <p className="text-danger text-xs">{errors.company.message}</p>
            ) : null}
          </Field>

          <Field label={t('emailLabel')}>
            <Input
              variant="secondary"
              type="email"
              fullWidth
              className={newsletterMembershipInputClassName}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email ? <p className="text-danger text-xs">{errors.email.message}</p> : null}
          </Field>

          <p className="text-foreground text-sm leading-relaxed">
            {t.rich('legalSubscribeConsent', {
              privacy: (chunks) => (
                <NavigationLink href="/privacy" target="_blank" chevron="none" size="sm">
                  {chunks}
                </NavigationLink>
              ),
              contact: (chunks) => (
                <NavigationLink href="/contact" chevron="none" size="sm">
                  {chunks}
                </NavigationLink>
              ),
            })}
          </p>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="font-display h-14 w-full gap-2 rounded-full text-base"
          >
            {t('subscribe')}
          </Button>
        </div>

        {submitted ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8"
            role="status"
          >
            <NewsletterSuccessContent message={t('successMessage')} />
          </div>
        ) : null}
      </form>
      {variant === 'standalone' && !submitted ? (
        <p className="text-muted text-center text-xs leading-relaxed">{t('legalDataUse')}</p>
      ) : null}
    </div>
  );
}
