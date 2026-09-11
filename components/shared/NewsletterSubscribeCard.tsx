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

const newsletterPanelClassName =
  'w-full rounded-2xl bg-white p-4 [box-shadow:var(--shadow-soft-panel)] sm:p-8';

type NewsletterFormValues = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
};

export function NewsletterSubscribeCard() {
  const t = useTranslations('newsletter');
  const tv = useTranslations('validation');
  const [submitted, setSubmitted] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        firstName: z
          .string()
          .trim()
          .min(1, tv('required'))
          .regex(PERSON_NAME_PATTERN, tv('personName')),
        lastName: z
          .string()
          .trim()
          .min(1, tv('required'))
          .regex(PERSON_NAME_PATTERN, tv('personName')),
        company: z
          .string()
          .trim()
          .min(1, tv('required'))
          .regex(COMPANY_NAME_PATTERN, tv('companyName')),
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
  }

  if (submitted) {
    return (
      <div className="flex w-full max-w-[440px] flex-col items-center">
        <div
          className={`${newsletterPanelClassName} flex flex-col items-center gap-3 py-6 text-center sm:py-8`}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'rgba(47,84,134,0.08)' }}
          >
            <EnvelopeSimple size={24} weight="fill" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-foreground text-base font-semibold">{t('successTitle')}</p>
          <p className="text-muted text-sm">{t('successBody')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center">
      <form
        className={`${newsletterPanelClassName} flex flex-col gap-6`}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t('firstNameLabel')}>
            <Input
              variant="secondary"
              fullWidth
              autoComplete="given-name"
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
              autoComplete="family-name"
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
            autoComplete="organization"
            aria-invalid={Boolean(errors.company)}
            {...register('company')}
          />
          {errors.company ? <p className="text-danger text-xs">{errors.company.message}</p> : null}
        </Field>

        <Field label={t('emailLabel')}>
          <Input
            variant="secondary"
            type="email"
            fullWidth
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email ? <p className="text-danger text-xs">{errors.email.message}</p> : null}
        </Field>

        <p className="text-foreground text-sm leading-relaxed">
          {t.rich('legalText', {
            br: () => <br />,
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
      </form>
    </div>
  );
}
