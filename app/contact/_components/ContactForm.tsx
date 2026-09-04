'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { COMPANY_NAME_PATTERN, countLetters, PERSON_NAME_PATTERN } from '@/lib/validation/patterns';
import {
  CONTACT_SUBJECTS,
  contactSubjectSchema,
  useCreateContactMessage,
  type ContactSpamChallenge,
  type ContactSubject,
} from '@/api/contact-messages';
import { Button, Input, ListBox, Select, TextArea } from '@/components/ui';

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label id={`${id}-label`} htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-danger mt-0.5 text-xs">{error}</p>}
    </div>
  );
}

interface ContactFormProps {
  defaultSubject?: ContactSubject;
  spamChallenge: ContactSpamChallenge;
}

type FormValues = {
  name: string;
  company: string;
  email: string;
  subject: ContactSubject;
  message: string;
  spam: string;
};

export function ContactForm({
  defaultSubject = 'general-question',
  spamChallenge,
}: ContactFormProps) {
  const t = useTranslations('contact.form');
  const tv = useTranslations('validation');
  const [sent, setSent] = useState(false);
  const createMessage = useCreateContactMessage();

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t('errors.nameRequired'))
          .regex(PERSON_NAME_PATTERN, tv('personName')),
        company: z
          .string()
          .trim()
          .refine((value) => value === '' || COMPANY_NAME_PATTERN.test(value), tv('companyName')),
        email: z.email(t('errors.emailInvalid')),
        subject: contactSubjectSchema,
        message: z
          .string()
          .trim()
          .min(10, tv('messageMin'))
          .max(5000, tv('messageMax'))
          .refine((value) => countLetters(value) >= 2, tv('message')),
        spam: z
          .string()
          .min(1, t('errors.spamRequired'))
          .refine((v) => parseInt(v, 10) === spamChallenge.answer, t('errors.spamIncorrect')),
      }),
    [spamChallenge.answer, t, tv]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: defaultSubject,
      company: '',
    },
  });

  async function onSubmit(values: FormValues) {
    await createMessage.mutateAsync({
      name: values.name,
      company: values.company,
      email: values.email,
      subject: values.subject,
      message: values.message,
    });
    setSent(true);
  }

  if (sent) {
    return (
      <div
        className="border-border rounded-xl border p-4 text-center sm:p-8"
        style={{ background: 'var(--accent-soft)' }}
      >
        <p className="text-foreground text-lg font-semibold">{t('successTitle')}</p>
        <p className="text-muted mt-2 text-sm">{t('successBody')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label={t('name')} error={errors.name?.message}>
          <Input
            id="name"
            variant="secondary"
            placeholder={t('namePlaceholder')}
            aria-invalid={!!errors.name}
            fullWidth
            {...register('name')}
          />
        </Field>
        <Field id="company" label={t('company')} error={errors.company?.message}>
          <Input
            id="company"
            variant="secondary"
            placeholder={t('companyPlaceholder')}
            fullWidth
            {...register('company')}
          />
        </Field>
      </div>

      <Field id="email" label={t('email')} error={errors.email?.message}>
        <Input
          id="email"
          variant="secondary"
          type="email"
          placeholder={t('emailPlaceholder')}
          aria-invalid={!!errors.email}
          fullWidth
          {...register('email')}
        />
      </Field>

      <Field id="subject" label={t('subject')} error={errors.subject?.message}>
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={(key) => {
                if (typeof key === 'string') {
                  field.onChange(key);
                }
              }}
              variant="secondary"
              fullWidth
              aria-labelledby="subject-label"
            >
              <Select.Trigger id="subject" aria-invalid={!!errors.subject}>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {CONTACT_SUBJECTS.map((subjectId) => (
                    <ListBox.Item
                      key={subjectId}
                      id={subjectId}
                      textValue={t(`subjects.${subjectId}`)}
                    >
                      {t(`subjects.${subjectId}`)}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        />
      </Field>

      <Field id="message" label={t('message')} error={errors.message?.message}>
        <TextArea
          id="message"
          variant="secondary"
          placeholder={t('messagePlaceholder')}
          rows={5}
          aria-invalid={!!errors.message}
          fullWidth
          {...register('message')}
        />
      </Field>

      <Field id="spam" label="" error={errors.spam?.message}>
        <div className="flex items-center gap-3">
          <p className="text-foreground">
            {t('spamLabel')}{' '}
            <strong className="text-foreground">
              {spamChallenge.a} + {spamChallenge.b}
            </strong>
          </p>
          <Input
            id="spam"
            variant="secondary"
            type="number"
            inputMode="numeric"
            placeholder="?"
            aria-label={t('spamAria')}
            aria-invalid={!!errors.spam}
            className="w-20 shrink-0"
            {...register('spam')}
          />
        </div>
      </Field>

      <p className="text-foreground leading-relaxed">
        {t.rich('privacyNote', {
          privacy: (chunks) => <Link href="/privacy">{chunks}</Link>,
        })}
      </p>

      <div>
        <Button
          type="submit"
          variant="primary"
          isDisabled={isSubmitting || createMessage.isPending}
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          {isSubmitting || createMessage.isPending ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
