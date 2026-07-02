'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Button, Input, TextArea } from '@/components/ui';

function makeSpamChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

type FormValues = {
  name: string;
  company?: string;
  email: string;
  message: string;
  spam: string;
};

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
        <label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-danger mt-0.5 text-xs">{error}</p>}
    </div>
  );
}

export function ContactForm() {
  const t = useTranslations('contact.form');
  const [sent, setSent] = useState(false);
  const challenge = useMemo(() => makeSpamChallenge(), []);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('errors.nameRequired')),
        company: z.string().optional(),
        email: z.email(t('errors.emailInvalid')),
        message: z.string().min(1, t('errors.messageRequired')),
        spam: z
          .string()
          .min(1, t('errors.spamRequired'))
          .refine((v) => parseInt(v, 10) === challenge.answer, t('errors.spamIncorrect')),
      }),
    [challenge.answer, t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit() {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        setSent(true);
        resolve();
      }, 800);
    });
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
              {challenge.a} + {challenge.b}
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
          isDisabled={isSubmitting}
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
