'use client';

import { type ReactNode, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, Spinner, useOverlayState } from '@/components/ui';
import { useSubscriptions } from '@/api/billing';
import {
  EU_REP_REPRESENTATIVE,
  findEuRepContractForLegalEntity,
  useEuRepContracts,
} from '@/api/eu-rep';
import type { EuRepPlanId } from '@/api/checkout';
import type { EuRepPostalFields } from '@/components/shared/EuRepContractFields';
import { EuRepWizardAlreadyCovered } from '../components/EuRepWizardAlreadyCovered';
import { EuRepWizardCoveredSection } from '../components/EuRepWizardCoveredSection';
import { EuRepWizardOffer } from '../components/EuRepWizardOffer';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { StepFrame } from '../ui/StepFrame';
import { Container } from '@/components/shared/Container';
import { WizardQuestionRow } from '../ui/WizardQuestionRow';
import { TextInput } from '../ui/FormSection';
import { CountryAutocomplete } from '../ui/CountryAutocomplete';
import { PostalAddressFields } from '../ui/PostalAddressFields';
import type { QuestionnaireFormData } from '../content/questionnaire-form';
import {
  euRepOfferVariant,
  mergeEuRepIntoFormData,
  shouldConfirmEuRepSkip,
  showThirdPartyRepFields,
  type EuRepState,
  type EuRepYesNo,
} from '../wizard-state';
import { EuRepRepresentativeAddress } from '@/components/shared/EuRepRepresentativeAddress';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface EuRepStepProps {
  formData: QuestionnaireFormData;
  initialEuRep?: EuRepState;
  onComplete: (next: EuRepState, formData: QuestionnaireFormData) => void;
  onBack?: () => void;
}

import {
  euRepEntityFieldsSchema,
  euRepThirdPartyRepSchema,
  mapZodFieldErrors,
} from '@/lib/validation/fields';

const revealEase = [0.25, 0.1, 0.25, 1] as const;

function Reveal({
  show,
  children,
  variant = 'collapse',
}: {
  show: boolean;
  children: React.ReactNode;
  variant?: 'collapse' | 'fade';
}) {
  const reduceMotion = useReducedMotion();

  if (variant === 'fade') {
    return (
      <AnimatePresence initial={false}>
        {show ? (
          <motion.div
            key="reveal-fade"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{
              duration: reduceMotion ? 0 : 0.25,
              ease: revealEase,
            }}
            className="flex flex-1 flex-col"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          key="reveal"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex flex-1 flex-col overflow-visible"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type FieldErrors = {
  hasNamedEuRep?: string;
  namedDatenschutzpartner?: string;
  thirdPartyRepName?: string;
  thirdPartyRepStreet?: string;
  thirdPartyRepPostalCode?: string;
  thirdPartyRepCity?: string;
  thirdPartyRepCountry?: string;
  thirdPartyRepEmail?: string;
  legalEntity?: string;
  forwardingEmail?: string;
} & Partial<Record<keyof EuRepPostalFields, string>>;

function emptyPostal(
  formData: QuestionnaireFormData,
  initialEuRep?: EuRepState
): EuRepPostalFields {
  return {
    postalLine1: initialEuRep?.postalLine1 ?? formData.street ?? '',
    postalLine2: initialEuRep?.postalLine2 ?? formData.streetLine2 ?? '',
    postalCode: initialEuRep?.postalCode ?? formData.postalCode ?? '',
    city: initialEuRep?.city ?? formData.city ?? '',
    country: initialEuRep?.country ?? 'Schweiz',
  };
}

export function EuRepStep({ formData, initialEuRep, onComplete, onBack }: EuRepStepProps) {
  const t = useTranslations('result.euRepStep');
  const tQuestionnaire = useTranslations('result.questionnaireStep');
  const tEuRepQ = useTranslations('euRepQuestionnaire');
  const tValidation = useTranslations('validation');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const contracts = useEuRepContracts();
  const subscriptions = useSubscriptions();
  const matchedContract = findEuRepContractForLegalEntity(
    contracts.data ?? [],
    formData.companyName,
    subscriptions.data ?? []
  );

  const yesNo = [
    { value: 'yes', label: tEuRepQ('yes') },
    { value: 'no', label: tEuRepQ('no') },
  ];

  const [hasNamedEuRep, setHasNamedEuRep] = useState<EuRepYesNo>(initialEuRep?.hasNamedEuRep ?? '');
  const [namedDatenschutzpartner, setNamedDatenschutzpartner] = useState<EuRepYesNo>(
    initialEuRep?.namedDatenschutzpartner ?? ''
  );
  const [thirdPartyRepName, setThirdPartyRepName] = useState(initialEuRep?.thirdPartyRepName ?? '');
  const [thirdPartyRepStreet, setThirdPartyRepStreet] = useState(
    initialEuRep?.thirdPartyRepStreet ?? ''
  );
  const [thirdPartyRepPostalCode, setThirdPartyRepPostalCode] = useState(
    initialEuRep?.thirdPartyRepPostalCode ?? ''
  );
  const [thirdPartyRepCity, setThirdPartyRepCity] = useState(initialEuRep?.thirdPartyRepCity ?? '');
  const [thirdPartyRepCountry, setThirdPartyRepCountry] = useState(
    initialEuRep?.thirdPartyRepCountry ?? ''
  );
  const [thirdPartyRepEmail, setThirdPartyRepEmail] = useState(
    initialEuRep?.thirdPartyRepEmail ?? ''
  );
  const [offerSelected, setOfferSelected] = useState(Boolean(initialEuRep?.plan));
  const [selectedPlanId, setSelectedPlanId] = useState<EuRepPlanId>(initialEuRep?.plan ?? 'basis');
  const [legalEntity, setLegalEntity] = useState(initialEuRep?.legalEntity ?? formData.companyName);
  const [forwardingEmail, setForwardingEmail] = useState(
    initialEuRep?.forwardingEmail ?? formData.email
  );
  const [postal, setPostal] = useState<EuRepPostalFields>(() =>
    emptyPostal(formData, initialEuRep)
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [validationAttempt, setValidationAttempt] = useState(0);
  const skipConfirm = useOverlayState();

  const offerVariant = euRepOfferVariant({ hasNamedEuRep, namedDatenschutzpartner });
  const isOfferActive = offerVariant === 'new' || offerSelected;
  const showSkipOffer = offerVariant === 'new' || (offerVariant === 'switch' && !offerSelected);

  const euRepDraft: EuRepState = {
    hasNamedEuRep,
    namedDatenschutzpartner,
    thirdPartyRepName,
    thirdPartyRepStreet,
    thirdPartyRepPostalCode,
    thirdPartyRepCity,
    thirdPartyRepCountry,
    thirdPartyRepEmail,
    plan: isOfferActive ? selectedPlanId : undefined,
    legalEntity,
    forwardingEmail,
    postalLine1: postal.postalLine1,
    postalLine2: postal.postalLine2,
    postalCode: postal.postalCode,
    city: postal.city,
    country: postal.country,
  };
  const thirdPartyVisible = showThirdPartyRepFields(euRepDraft);
  const showEuRepOffer =
    offerVariant === 'new' ? hasNamedEuRep === 'no' : offerVariant === 'switch' && offerSelected;

  function validate(): boolean {
    const nextErrors: FieldErrors = {
      ...validateRepStatusErrors(),
    };

    if (thirdPartyVisible) {
      const thirdPartyResult = euRepThirdPartyRepSchema.safeParse({
        thirdPartyRepName,
        thirdPartyRepStreet,
        thirdPartyRepPostalCode,
        thirdPartyRepCity,
        thirdPartyRepCountry,
        thirdPartyRepEmail,
      });
      if (!thirdPartyResult.success) {
        Object.assign(nextErrors, mapZodFieldErrors(thirdPartyResult.error, tValidation));
      }
    }

    if (isOfferActive) {
      const entityResult = euRepEntityFieldsSchema.safeParse({
        legalEntity,
        forwardingEmail,
        postalLine1: postal.postalLine1,
        postalLine2: postal.postalLine2 ?? '',
        postalCode: postal.postalCode,
        city: postal.city,
        country: postal.country,
      });
      if (!entityResult.success) {
        Object.assign(nextErrors, mapZodFieldErrors(entityResult.error, tValidation));
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setValidationAttempt((count) => count + 1);
    }
    return Object.keys(nextErrors).length === 0;
  }

  function validateRepStatusErrors(): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (!namedDatenschutzpartner) {
      nextErrors.namedDatenschutzpartner = tValidation('required');
    }

    if (namedDatenschutzpartner === 'no' && !hasNamedEuRep) {
      nextErrors.hasNamedEuRep = tValidation('required');
    }

    return nextErrors;
  }

  function validateRepStatus(): boolean {
    const nextErrors = validateRepStatusErrors();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setValidationAttempt((count) => count + 1);
    }
    return Object.keys(nextErrors).length === 0;
  }

  function buildCompletedState(
    includeThirdParty: boolean,
    options?: { skipOffer?: boolean }
  ): EuRepState {
    const includeOffer = isOfferActive && !options?.skipOffer;
    const completed: EuRepState = {
      hasNamedEuRep: namedDatenschutzpartner === 'yes' ? 'yes' : hasNamedEuRep || undefined,
      namedDatenschutzpartner,
      declined: !includeOffer,
      done: true,
    };

    if (includeThirdParty && thirdPartyVisible) {
      completed.thirdPartyRepName = thirdPartyRepName.trim();
      completed.thirdPartyRepStreet = thirdPartyRepStreet.trim();
      completed.thirdPartyRepPostalCode = thirdPartyRepPostalCode.trim();
      completed.thirdPartyRepCity = thirdPartyRepCity.trim();
      completed.thirdPartyRepCountry = thirdPartyRepCountry.trim();
      completed.thirdPartyRepEmail = thirdPartyRepEmail.trim();
    }

    if (includeOffer) {
      completed.plan = selectedPlanId;
      completed.legalEntity = legalEntity.trim();
      completed.forwardingEmail = forwardingEmail.trim();
      completed.postalLine1 = postal.postalLine1.trim();
      completed.postalLine2 = postal.postalLine2?.trim() || undefined;
      completed.postalCode = postal.postalCode.trim();
      completed.city = postal.city.trim();
      completed.country = postal.country.trim() || 'Schweiz';
      completed.declined = false;
    }

    return completed;
  }

  function finalizeComplete(includeThirdParty: boolean, options?: { skipOffer?: boolean }) {
    const completed = buildCompletedState(includeThirdParty, options);
    onComplete(completed, mergeEuRepIntoFormData(formData, completed));
  }

  function attemptComplete(includeThirdParty: boolean, options?: { skipOffer?: boolean }) {
    if (matchedContract) {
      onComplete(
        {
          linkContractId: matchedContract.id,
          hasNamedEuRep: 'yes',
          namedDatenschutzpartner: 'yes',
          declined: false,
          done: true,
        },
        mergeEuRepIntoFormData(formData, {
          hasNamedEuRep: 'yes',
          namedDatenschutzpartner: 'yes',
        })
      );
      return;
    }

    if (includeThirdParty ? !validate() : !validateRepStatus()) return;

    const completed = buildCompletedState(includeThirdParty, options);
    if (shouldConfirmEuRepSkip(formData, completed)) {
      skipConfirm.open();
      return;
    }

    finalizeComplete(includeThirdParty, options);
  }

  function handleContinue() {
    attemptComplete(true);
  }

  function handleSkip() {
    attemptComplete(false, { skipOffer: true });
  }

  function handleConfirmSkip() {
    skipConfirm.close();
    finalizeComplete(false, { skipOffer: true });
  }

  if (contracts.isLoading) {
    return (
      <StepFrame scrollWithContent centerContent>
        <Container className="flex flex-1 flex-col">
          <div className="border-border divide-border flex flex-1 flex-col divide-y border-x">
            <StepHeader
              title={t('title')}
              description={t('intro')}
              sideBorders={false}
              contained={false}
              bottomBorder={false}
            />
            <div className="flex flex-1 items-center justify-center py-10">
              <Spinner aria-label={tAccount('loading')} />
            </div>
          </div>
        </Container>
      </StepFrame>
    );
  }

  if (matchedContract) {
    return (
      <StepFrame
        scrollWithContent
        footer={
          <StepFooter onBack={onBack} onContinue={handleContinue} ctaLabel={tCommon('continue')} />
        }
      >
        <Container className="flex flex-1 flex-col">
          <div className="border-border divide-border flex flex-1 flex-col divide-y overflow-visible border-x">
            <StepHeader
              title={t('title')}
              sideBorders={false}
              contained={false}
              bottomBorder={false}
            />
            <EuRepWizardAlreadyCovered contract={matchedContract} />
          </div>
        </Container>
      </StepFrame>
    );
  }

  return (
    <>
      <StepFrame
        scrollWithContent
        footer={
          <StepFooter
            onBack={onBack}
            onContinue={handleContinue}
            onSkip={showSkipOffer ? handleSkip : undefined}
            skipLabel={tCommon('skip')}
            ctaLabel={tCommon('continue')}
          />
        }
      >
        <Container className="flex flex-1 flex-col">
          <div className="border-border divide-border flex flex-1 flex-col divide-y border-x">
            <StepHeader
              title={t('title')}
              description={t('intro')}
              sideBorders={false}
              contained={false}
              bottomBorder={false}
            />
            <WizardQuestionRow
              variant="choices"
              name="namedDatenschutzpartner"
              options={yesNo}
              value={namedDatenschutzpartner}
              label={t('namedDatenschutzpartner', {
                company: EU_REP_REPRESENTATIVE.name,
              })}
              required={Boolean(errors.namedDatenschutzpartner)}
              requiredBadgeLabel={tQuestionnaire('requiredBadge')}
              requiredShakeKey={validationAttempt}
              onChange={(value) => {
                const next = value as EuRepYesNo;
                setNamedDatenschutzpartner(next);
                if (next === 'yes') {
                  setHasNamedEuRep('yes');
                } else {
                  setHasNamedEuRep('');
                }
                setErrors((current) => ({ ...current, namedDatenschutzpartner: undefined }));
              }}
            />

            <Reveal show={namedDatenschutzpartner === 'yes'}>
              <EuRepWizardCoveredSection
                title={t('gotYouCovered')}
                body={t('gotYouCoveredRepresentativeIntro')}
              >
                <EuRepRepresentativeAddress plain hideTitle />
              </EuRepWizardCoveredSection>
            </Reveal>

            <Reveal show={namedDatenschutzpartner === 'no'}>
              <WizardQuestionRow
                variant="choices"
                name="hasNamedEuRep"
                options={yesNo}
                value={hasNamedEuRep}
                label={t('hasNamedEuRep')}
                required={Boolean(errors.hasNamedEuRep)}
                requiredBadgeLabel={tQuestionnaire('requiredBadge')}
                requiredShakeKey={validationAttempt}
                onChange={(value) => {
                  const next = value as EuRepYesNo;
                  setHasNamedEuRep(next);
                  setOfferSelected(next === 'no');
                  if (next === 'no') {
                    setSelectedPlanId('basis');
                  }
                  setErrors((current) => ({ ...current, hasNamedEuRep: undefined }));
                }}
                followUp={
                  <Reveal show={thirdPartyVisible}>
                    <div className="flex w-full flex-col gap-4 pt-6 lg:w-1/2">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="thirdPartyRepName"
                          className="text-foreground text-sm font-medium"
                        >
                          {tQuestionnaire('fields.thirdPartyRepName')}
                        </label>
                        <TextInput
                          value={thirdPartyRepName}
                          onChange={(event) => {
                            setThirdPartyRepName(event.target.value);
                            setErrors((current) => ({ ...current, thirdPartyRepName: undefined }));
                          }}
                        />
                        {errors.thirdPartyRepName ? (
                          <p className="text-danger text-xs">{errors.thirdPartyRepName}</p>
                        ) : null}
                      </div>

                      <PostalAddressFields
                        street={thirdPartyRepStreet}
                        postalCode={thirdPartyRepPostalCode}
                        city={thirdPartyRepCity}
                        onStreetChange={(value) => {
                          setThirdPartyRepStreet(value);
                          setErrors((current) => ({ ...current, thirdPartyRepStreet: undefined }));
                        }}
                        onPostalCodeChange={(value) => {
                          setThirdPartyRepPostalCode(value);
                          setErrors((current) => ({
                            ...current,
                            thirdPartyRepPostalCode: undefined,
                          }));
                        }}
                        onCityChange={(value) => {
                          setThirdPartyRepCity(value);
                          setErrors((current) => ({ ...current, thirdPartyRepCity: undefined }));
                        }}
                        showLine2={false}
                        line1Error={
                          errors.thirdPartyRepStreet ??
                          errors.thirdPartyRepPostalCode ??
                          errors.thirdPartyRepCity
                        }
                      />

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="thirdPartyRepCountry"
                          className="text-foreground text-sm font-medium"
                        >
                          {tQuestionnaire('fields.thirdPartyRepCountry')}
                        </label>
                        <CountryAutocomplete
                          value={thirdPartyRepCountry}
                          placeholder={tQuestionnaire('placeholders.select')}
                          onChange={(value) => {
                            setThirdPartyRepCountry(value);
                            setErrors((current) => ({
                              ...current,
                              thirdPartyRepCountry: undefined,
                            }));
                          }}
                        />
                        {errors.thirdPartyRepCountry ? (
                          <p className="text-danger text-xs">{errors.thirdPartyRepCountry}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="thirdPartyRepEmail"
                          className="text-foreground text-sm font-medium"
                        >
                          {tQuestionnaire('fields.thirdPartyRepEmail')}
                        </label>
                        <TextInput
                          type="email"
                          value={thirdPartyRepEmail}
                          onChange={(event) => {
                            setThirdPartyRepEmail(event.target.value);
                            setErrors((current) => ({ ...current, thirdPartyRepEmail: undefined }));
                          }}
                        />
                        {errors.thirdPartyRepEmail ? (
                          <p className="text-danger text-xs">{errors.thirdPartyRepEmail}</p>
                        ) : null}
                      </div>

                      {offerVariant === 'switch' && !offerSelected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-fit rounded-full"
                          onPress={() => {
                            setHasNamedEuRep('no');
                            setOfferSelected(true);
                            setSelectedPlanId('basis');
                            setErrors((current) => ({
                              ...current,
                              hasNamedEuRep: undefined,
                              thirdPartyRepName: undefined,
                              thirdPartyRepStreet: undefined,
                              thirdPartyRepPostalCode: undefined,
                              thirdPartyRepCity: undefined,
                              thirdPartyRepCountry: undefined,
                              thirdPartyRepEmail: undefined,
                            }));
                          }}
                        >
                          {t('switchToDatenschutzpartner')}
                        </Button>
                      ) : null}
                    </div>
                  </Reveal>
                }
              />
            </Reveal>

            <Reveal show={showEuRepOffer} variant="fade">
              {offerVariant ? (
                <EuRepWizardOffer
                  variant={offerVariant}
                  selected={offerSelected}
                  onSelectedChange={(value) => {
                    setOfferSelected(value);
                    if (!value) {
                      setErrors((current) => ({
                        ...current,
                        legalEntity: undefined,
                        forwardingEmail: undefined,
                        postalLine1: undefined,
                        postalLine2: undefined,
                        postalCode: undefined,
                        city: undefined,
                        country: undefined,
                      }));
                    }
                  }}
                  legalEntity={legalEntity}
                  forwardingEmail={forwardingEmail}
                  onLegalEntityChange={(value) => {
                    setLegalEntity(value);
                    setErrors((current) => ({ ...current, legalEntity: undefined }));
                  }}
                  onForwardingEmailChange={(value) => {
                    setForwardingEmail(value);
                    setErrors((current) => ({ ...current, forwardingEmail: undefined }));
                  }}
                  legalEntityError={errors.legalEntity}
                  forwardingEmailError={errors.forwardingEmail}
                  postal={postal}
                  onPostalChange={(patch) => {
                    setPostal((current) => ({ ...current, ...patch }));
                    setErrors((current) => {
                      const next = { ...current };
                      for (const key of Object.keys(patch) as Array<keyof EuRepPostalFields>) {
                        delete next[key];
                      }
                      return next;
                    });
                  }}
                  postalErrors={errors}
                  selectedPlanId={selectedPlanId}
                  onPlanChange={setSelectedPlanId}
                />
              ) : null}
            </Reveal>
          </div>
        </Container>
      </StepFrame>

      <ConfirmDialog
        state={skipConfirm}
        title={t('skipConfirmTitle')}
        body={
          <>
            <p>{t('skipConfirmBody')}</p>
            <p className="mt-3">{t('requiredDisclaimer')}</p>
          </>
        }
        confirmLabel={t('skipConfirmProceed')}
        cancelLabel={t('skipConfirmCancel')}
        onConfirm={handleConfirmSkip}
      />
    </>
  );
}
