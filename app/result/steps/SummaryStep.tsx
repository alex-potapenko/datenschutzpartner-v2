'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRegister } from '@/api/auth';
import { env } from '@/env';
import {
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  EnvelopeSimple,
  Input,
} from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { Field } from '../ui/FormSection';
import { StepFooter } from '../ui/StepFooter';
import { StepFrame } from '../ui/StepFrame';
import { StepHeader } from '../ui/StepHeader';
import { buildTrialCheckoutPayload } from '../trial-payload';
import type { QuestionnaireFormData } from '../content/questionnaire-form';
import type { EuRepState } from '../wizard-state';

interface SummaryStepProps {
  domain: string;
  formData: QuestionnaireFormData;
  euRep: EuRepState;
  fillSubscriptionId?: string;
  onBack: () => void;
}

type WelcomeFormValues = {
  email: string;
  acceptTerms: boolean;
  newsletter: boolean;
};

export function SummaryStep({
  domain,
  formData,
  euRep,
  fillSubscriptionId,
  onBack,
}: SummaryStepProps) {
  const t = useTranslations('result.summary');
  const tv = useTranslations('validation');
  const registerAccount = useRegister();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(tv('email')),
        acceptTerms: z.boolean().refine((value) => value, { message: tv('terms') }),
        newsletter: z.boolean(),
      }),
    [tv]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WelcomeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: formData.email,
      acceptTerms: false,
      newsletter: false,
    },
  });

  async function onSubmit(values: WelcomeFormValues) {
    const payload = buildTrialCheckoutPayload(domain, formData, euRep, fillSubscriptionId);

    try {
      const result = await registerAccount.mutateAsync({
        email: values.email,
        acceptTerms: values.acceptTerms,
        newsletter: values.newsletter,
        domain: payload.domain ?? domain,
        policyName: payload.policyName,
        legalEntity: payload.legalEntity,
        fillSubscriptionId: payload.fillSubscriptionId,
        euRepEntityCount: payload.euRepEntityCount,
        euRepEntities: payload.euRepEntities,
        euRepLinkContractId: payload.euRepLinkContractId,
      });
      setPendingEmail(result.email);
      setVerificationUrl(result.verificationUrl);
    } catch {
      toast.error(t('verificationFailed'));
    }
  }

  if (pendingEmail) {
    return (
      <StepFrame
        centerContent
        header={
          <StepHeader
            title={t('inboxTitle')}
            description={<p>{t('inboxBody', { email: pendingEmail })}</p>}
          />
        }
        footer={<StepFooter onBack={onBack} />}
      >
        <Container className="flex h-full flex-1 flex-col overflow-visible">
          <div className="border-border flex h-full flex-1 flex-col overflow-visible border-r border-l">
            <div className="flex h-full flex-1 flex-col px-4 pt-10 pb-10 sm:px-8 sm:pt-16">
              <div className="flex w-full max-w-2xl flex-col items-start gap-6 text-left">
                <div className="bg-key-50 flex size-12 items-center justify-center rounded-2xl">
                  <EnvelopeSimple size={24} className="text-accent" aria-hidden />
                </div>
                <p className="text-foreground text-sm leading-relaxed">{t('inboxHint')}</p>
                {env.NEXT_PUBLIC_API_MOCKING === 'enabled' ? (
                  <p className="text-muted text-sm leading-relaxed">
                    {t('inboxPrototypePassword', { password: 'welcome' })}
                  </p>
                ) : null}
                {verificationUrl ? (
                  <Link
                    href={verificationUrl}
                    className="text-accent text-sm font-medium underline decoration-transparent underline-offset-[3px] hover:decoration-current"
                  >
                    {t('openConfirmation')}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </StepFrame>
    );
  }

  return (
    <StepFrame
      centerContent
      header={<StepHeader title={t('welcomeTitle')} description={<p>{t('welcomeBody')}</p>} />}
      footer={
        <StepFooter
          onBack={onBack}
          onContinue={() => void handleSubmit(onSubmit)()}
          ctaLabel={t('sendConfirmationCta')}
          ctaDisabled={registerAccount.isPending}
        />
      }
    >
      <Container className="flex h-full flex-1 flex-col overflow-visible">
        <div className="border-border flex h-full flex-1 flex-col overflow-visible border-r border-l">
          <div className="flex h-full flex-1 flex-col px-4 pt-10 pb-10 sm:px-8 sm:pt-16">
            <form className="flex w-full max-w-2xl flex-col items-start gap-6 text-left" noValidate>
              <Field label={t('emailLabel')} hint={t('emailHint')}>
                <Input
                  variant="secondary"
                  type="email"
                  fullWidth
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
                {errors.email ? (
                  <p className="text-danger text-xs">{errors.email.message}</p>
                ) : null}
              </Field>

              <div className="flex flex-col gap-3">
                <Controller
                  name="acceptTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      variant="secondary"
                      isSelected={field.value}
                      onChange={field.onChange}
                    >
                      <CheckboxControl>
                        <CheckboxIndicator />
                      </CheckboxControl>
                      <CheckboxContent>
                        {t.rich('acceptTerms', {
                          terms: (chunks) => (
                            <Link
                              href="/terms"
                              className="text-accent underline underline-offset-2"
                            >
                              {chunks}
                            </Link>
                          ),
                        })}
                      </CheckboxContent>
                    </Checkbox>
                  )}
                />
                {errors.acceptTerms ? (
                  <p className="text-danger text-xs">{errors.acceptTerms.message}</p>
                ) : null}

                <Controller
                  name="newsletter"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      variant="secondary"
                      isSelected={field.value}
                      onChange={field.onChange}
                    >
                      <CheckboxControl>
                        <CheckboxIndicator />
                      </CheckboxControl>
                      <CheckboxContent>{t('newsletter')}</CheckboxContent>
                    </Checkbox>
                  )}
                />
              </div>
            </form>
          </div>
        </div>
      </Container>
    </StepFrame>
  );
}
