'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSession } from '@/api/auth';
import {
  createAffiliateApplicationFormSchema,
  useCreateAffiliateApplication,
  type AffiliateApplicationForm as FormValues,
} from '@/api/affiliate';
import { Field } from '@/app/result/ui/FormSection';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { newsletterMembershipInputClassName } from '@/components/shared/newsletter-membership-input';
import { AFFILIATE_TERMS_HREF } from '@/lib/affiliate-links';
import {
  ArrowSquareOut,
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

function stopCheckboxActivation(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

type AffiliateApplicationFormProps = {
  /** Shorter copy for the public landing card. */
  variant?: 'landing' | 'account';
  onSubmittedChange?: (submitted: boolean) => void;
};

export function AffiliateApplicationForm({
  variant = 'landing',
  onSubmittedChange,
}: AffiliateApplicationFormProps) {
  const t = useTranslations(
    variant === 'account' ? 'account.affiliate.application' : 'affiliatePage.registration'
  );
  const tv = useTranslations('validation');
  const session = useSession();
  const [submitted, setSubmitted] = useState(false);
  const createApplication = useCreateAffiliateApplication();

  const schema = useMemo(() => createAffiliateApplicationFormSchema(tv), [tv]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      websiteUrl: '',
      description: '',
      acceptTerms: false,
    },
  });

  useEffect(() => {
    const email = session.data?.email;
    if (email) {
      reset((current) => ({ ...current, email }));
    }
  }, [session.data?.email, reset]);

  useEffect(() => {
    onSubmittedChange?.(submitted);
  }, [onSubmittedChange, submitted]);

  async function onSubmit(values: FormValues) {
    await createApplication.mutateAsync({
      email: values.email,
      websiteUrl: values.websiteUrl,
      description: values.description,
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
          {onSubmittedChange ? null : (
            <p className="text-foreground text-base font-semibold">{t('successTitle')}</p>
          )}
          <p className="text-foreground text-sm leading-relaxed">{t('successBody')}</p>
        </div>
      </div>
    );
  }

  const isBusy = isSubmitting || createApplication.isPending;
  const emailLocked = Boolean(session.data?.email);

  return (
    <form
      className="membership-soft-panel flex w-full flex-col gap-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-5">
        <Field label={t('emailLabel')} htmlFor="affiliate-email">
          <Input
            id="affiliate-email"
            variant="secondary"
            type="email"
            fullWidth
            readOnly={emailLocked}
            aria-required
            className={newsletterMembershipInputClassName}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          <FieldErrorText message={errors.email?.message} />
        </Field>

        <Field label={t('websiteLabel')} htmlFor="affiliate-website">
          <Input
            id="affiliate-website"
            variant="secondary"
            type="url"
            inputMode="url"
            fullWidth
            aria-required
            className={newsletterMembershipInputClassName}
            autoComplete="url"
            spellCheck={false}
            aria-invalid={Boolean(errors.websiteUrl)}
            {...register('websiteUrl')}
          />
          <FieldErrorText message={errors.websiteUrl?.message} />
        </Field>

        <Field label={t('descriptionLabel')} htmlFor="affiliate-description">
          <TextArea
            id="affiliate-description"
            variant="secondary"
            rows={4}
            fullWidth
            placeholder={t('descriptionPlaceholder')}
            className={newsletterMembershipInputClassName}
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
          <FieldErrorText message={errors.description?.message} />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <Checkbox
              variant="secondary"
              className="items-center gap-2"
              isSelected={field.value}
              onChange={field.onChange}
              aria-invalid={Boolean(errors.acceptTerms)}
            >
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
              <CheckboxContent>
                <span className="text-foreground text-sm leading-snug">
                  {t.rich('acceptTerms', {
                    terms: (chunks) => (
                      <NavigationLink
                        href={AFFILIATE_TERMS_HREF}
                        target="_blank"
                        chevron="none"
                        size="sm"
                        className="inline-flex items-baseline gap-0.5 align-baseline"
                        onClick={stopCheckboxActivation}
                        onPointerDown={stopCheckboxActivation}
                      >
                        {chunks}
                        <ArrowSquareOut
                          size={14}
                          weight="bold"
                          aria-hidden
                          className="relative top-px shrink-0"
                        />
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
