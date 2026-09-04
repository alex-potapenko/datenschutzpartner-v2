'use client';

import { useMemo, type SyntheticEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { PERSON_NAME_PATTERN } from '@/lib/validation/patterns';
import { useRegister } from '@/api/auth';
import {
  ArrowSquareOut,
  Button,
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  Input,
} from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { ValidationRequiredBadge } from '@/components/shared/ValidationRequiredBadge';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { SummaryWelcomeBenefits } from '../components/SummaryWelcomeBenefits';
import { Field } from '../ui/FormSection';
import { StepFooter } from '../ui/StepFooter';
import { StepFrame } from '../ui/StepFrame';
import { StepHeader } from '../ui/StepHeader';
import { buildTrialCheckoutPayload } from '../trial-payload';
import type { QuestionnaireFormData } from '../content/questionnaire-form';
import { isBuyingEuRep, type EuRepState } from '../wizard-state';

interface SummaryStepProps {
  domain: string;
  formData: QuestionnaireFormData;
  euRep: EuRepState;
  fillSubscriptionId?: string;
  onBack: () => void;
  /** Registration succeeded — the wizard swaps in the isolated activation screen. */
  onRegistered: (payload: { email: string; verificationUrl?: string | null }) => void;
}

type WelcomeFormValues = {
  firstName: string;
  lastName: string;
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
  onRegistered,
}: SummaryStepProps) {
  const t = useTranslations('result.summary');
  const tFooter = useTranslations('footer');
  const tQuestionnaire = useTranslations('result.questionnaireStep');
  const tv = useTranslations('validation');
  const registerAccount = useRegister();

  function stopCheckboxActivation(event: SyntheticEvent) {
    event.stopPropagation();
  }

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
    formState: { errors, submitCount },
  } = useForm<WelcomeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
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
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        acceptTerms: values.acceptTerms,
        newsletter: values.newsletter,
        domain: payload.domain ?? domain,
        policyName: payload.policyName,
        legalEntity: payload.legalEntity,
        fillSubscriptionId: payload.fillSubscriptionId,
        euRepEntityCount: payload.euRepEntityCount,
        euRepPlanId: payload.euRepPlanId,
        euRepEntities: payload.euRepEntities,
        euRepLinkContractId: payload.euRepLinkContractId,
      });
      onRegistered({ email: result.email, verificationUrl: result.verificationUrl });
    } catch {
      toast.error(t('verificationFailed'));
    }
  }

  return (
    <StepFrame
      header={
        <StepHeader
          title={t('welcomeTitle')}
          showSuccessCheck
          description={<p>{t('welcomeBodyDescription', { domain })}</p>}
        />
      }
      footer={<StepFooter onBack={onBack} />}
    >
      <Container className="flex h-full min-h-0 flex-1 flex-col">
        <div className="border-border flex h-full min-h-0 flex-1 flex-col border-x">
          <div className="grid h-full min-h-0 flex-1 grid-cols-1 items-stretch lg:grid-cols-2">
            <div className="border-border flex h-full min-h-0 flex-col border-r">
              <div className="shrink-0 px-4 pt-8 sm:px-8 lg:pt-12">
                <h2 className="text-foreground text-xl font-bold sm:text-2xl">
                  {t('welcomeBody')}
                </h2>
              </div>

              <div className="flex flex-col gap-6 px-4 pt-8 pb-8 sm:px-8 sm:pb-10 lg:pb-12">
                <form className="flex w-full flex-col items-start gap-6 text-left" noValidate>
                  <div className="grid w-full grid-cols-2 gap-5">
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

                  <div className="w-full sm:w-[calc(50%-0.625rem)]">
                    <Field
                      label={t('emailLabel')}
                      hint={t('emailHint')}
                      hintClassName="text-foreground text-sm whitespace-nowrap"
                    >
                      <Input
                        variant="secondary"
                        type="email"
                        fullWidth
                        autoComplete="email"
                        aria-invalid={Boolean(errors.email)}
                        {...register('email')}
                      />
                      {errors.email ? (
                        <p className="text-danger text-xs">{errors.email.message}</p>
                      ) : null}
                    </Field>
                  </div>

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
                            <span className="text-sm leading-snug">
                              {t('acceptTermsPrefix')}
                              <NavigationLink
                                href="/terms"
                                target="_blank"
                                chevron="none"
                                size="sm"
                                className="ml-1 inline-flex align-baseline"
                                onClick={stopCheckboxActivation}
                                onPointerDown={stopCheckboxActivation}
                              >
                                {tFooter('termsOfService')}
                                <ArrowSquareOut size={14} weight="bold" aria-hidden />
                              </NavigationLink>
                              <ValidationRequiredBadge
                                show={Boolean(errors.acceptTerms)}
                                shakeKey={submitCount}
                                className="ml-1.5"
                              >
                                {tQuestionnaire('requiredBadge')}
                              </ValidationRequiredBadge>
                            </span>
                          </CheckboxContent>
                        </Checkbox>
                      )}
                    />

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
                          <CheckboxContent>
                            <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                              <span>{t('newsletter')}</span>
                              <MetaBadge kind="optional" className="shrink-0">
                                {tQuestionnaire('optionalBadge')}
                              </MetaBadge>
                            </span>
                          </CheckboxContent>
                        </Checkbox>
                      )}
                    />
                  </div>
                </form>

                <Button
                  variant="primary"
                  size="lg"
                  className="h-11 rounded-full px-6 sm:h-14 sm:px-8"
                  onPress={() => void handleSubmit(onSubmit)()}
                  isDisabled={registerAccount.isPending}
                >
                  {t('sendConfirmationCta')}
                </Button>
              </div>
            </div>

            <div className="flex h-full min-h-0 flex-col overflow-visible px-4 py-8 sm:px-8 sm:py-10 lg:py-12">
              <SummaryWelcomeBenefits domain={domain} includeEuRep={isBuyingEuRep(euRep)} />
            </div>
          </div>
        </div>
      </Container>
    </StepFrame>
  );
}
