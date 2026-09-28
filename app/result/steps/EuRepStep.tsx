'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, Spinner, useOverlayState } from '@/components/ui';
import { useSubscriptions } from '@/api/billing';
import { useSession } from '@/api/auth';
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
import { WizardBorderedColumn } from '../ui/WizardBorderedColumn';
import { Container } from '@/components/shared/Container';
import { WizardQuestionRow } from '../ui/WizardQuestionRow';
import { TextInput } from '../ui/FormSection';
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
import { displayCountryLabel, SWISS_COUNTRY_STORAGE } from '@/lib/swiss-country';
import { cn, smoothScrollElementIntoView } from '@/lib/utils';

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
import { FieldErrorText } from '@/components/shared/FieldErrorText';

const revealEase = [0.25, 0.1, 0.25, 1] as const;

function Reveal({
  show,
  children,
  variant = 'collapse',
  fill = false,
  overflowVisible = false,
}: {
  show: boolean;
  children: React.ReactNode;
  variant?: 'collapse' | 'fade';
  /** Stretch to the remaining column height (checkout offer panels). */
  fill?: boolean;
  /** Allow glows and shadows to extend outside the revealed panel. */
  overflowVisible?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.28;
  const fillClassName = fill ? 'flex min-h-0 flex-1 flex-col' : undefined;
  const clipClassName = overflowVisible ? 'overflow-visible' : 'overflow-hidden';

  if (variant === 'fade') {
    return (
      <AnimatePresence initial={false}>
        {show ? (
          <motion.div
            key="reveal-fade"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: revealEase }}
            className={fillClassName}
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
          initial={reduceMotion ? false : { opacity: 0, gridTemplateRows: '0fr' }}
          animate={{ opacity: 1, gridTemplateRows: '1fr' }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: revealEase }}
          className={cn('grid', overflowVisible && 'overflow-visible')}
        >
          <div className={clipClassName}>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: revealEase }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function EuRepPartnerFollowUp({
  branch,
  children,
}: {
  branch: EuRepYesNo | '';
  children: (variant: 'covered' | 'follow-up') => ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.22;

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {branch === 'yes' ? (
          <motion.div
            key="covered"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: revealEase }}
          >
            {children('covered')}
          </motion.div>
        ) : branch === 'no' ? (
          <motion.div
            key="follow-up"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: revealEase }}
          >
            {children('follow-up')}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
    postalDepartment: initialEuRep?.postalDepartment ?? '',
    postalLine1: initialEuRep?.postalLine1 ?? formData.street,
    postalLine2: initialEuRep?.postalLine2 ?? formData.streetLine2,
    postalCode: initialEuRep?.postalCode ?? formData.postalCode,
    city: initialEuRep?.city ?? formData.city,
    country: initialEuRep?.country ?? SWISS_COUNTRY_STORAGE,
  };
}

export function EuRepStep({ formData, initialEuRep, onComplete, onBack }: EuRepStepProps) {
  const t = useTranslations('result.euRepStep');
  const tQuestionnaire = useTranslations('result.questionnaireStep');
  const tEuRepQ = useTranslations('euRepQuestionnaire');
  const tValidation = useTranslations('validation');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const euRepIntro = (
    <p>
      {t.rich('intro', {
        br: () => <br />,
      })}
    </p>
  );
  const session = useSession();
  const isLoggedIn = Boolean(session.data?.email && session.data.emailVerified);
  const continueCtaLabel = tQuestionnaire('createPolicy');
  const showContinueCaret = !isLoggedIn;
  const contracts = useEuRepContracts();
  const subscriptions = useSubscriptions();
  const questionnaireLegalEntity = formData.companyName.trim();
  const matchedContract = isLoggedIn
    ? findEuRepContractForLegalEntity(
        contracts.data ?? [],
        questionnaireLegalEntity,
        subscriptions.data ?? []
      )
    : undefined;
  const isResolvingExistingContract =
    isLoggedIn && (session.isLoading || contracts.isLoading || subscriptions.isLoading);

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
  const [thirdPartyRepCountry] = useState(
    initialEuRep?.thirdPartyRepCountry?.trim() || SWISS_COUNTRY_STORAGE
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
  const reduceMotion = useReducedMotion();
  const euRepOfferRef = useRef<HTMLDivElement>(null);
  const euRepThirdPartyRef = useRef<HTMLDivElement>(null);

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
    postalDepartment: postal.postalDepartment,
    postalLine1: postal.postalLine1,
    postalLine2: postal.postalLine2,
    postalCode: postal.postalCode,
    city: postal.city,
    country: postal.country,
  };
  const thirdPartyVisible = showThirdPartyRepFields(euRepDraft);
  const showEuRepOffer =
    offerVariant === 'new' ? hasNamedEuRep === 'no' : offerVariant === 'switch' && offerSelected;
  const borderedColumnLayoutKey = `${namedDatenschutzpartner}:${hasNamedEuRep}:${thirdPartyVisible}:${showEuRepOffer}`;

  useEffect(() => {
    const scrollTarget = showEuRepOffer
      ? euRepOfferRef.current
      : thirdPartyVisible
        ? euRepThirdPartyRef.current
        : null;

    if (!scrollTarget) return;

    let cancelled = false;
    const scrollDelayMs = reduceMotion ? 0 : 300;

    const timer = window.setTimeout(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;

        smoothScrollElementIntoView(scrollTarget, {
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      });
    }, scrollDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showEuRepOffer, thirdPartyVisible, reduceMotion]);

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
        postalDepartment: postal.postalDepartment ?? '',
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
      completed.thirdPartyRepCountry = SWISS_COUNTRY_STORAGE;
      completed.thirdPartyRepEmail = thirdPartyRepEmail.trim();
    }

    if (includeOffer) {
      completed.plan = selectedPlanId;
      completed.legalEntity = legalEntity.trim();
      completed.forwardingEmail = forwardingEmail.trim();
      completed.postalDepartment = postal.postalDepartment?.trim() || undefined;
      completed.postalLine1 = postal.postalLine1.trim();
      completed.postalLine2 = postal.postalLine2?.trim() || undefined;
      completed.postalCode = postal.postalCode.trim();
      completed.city = postal.city.trim();
      completed.country = SWISS_COUNTRY_STORAGE;
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

  if (isResolvingExistingContract) {
    return (
      <StepFrame scrollWithContent>
        <Container className="flex min-h-full flex-1 flex-col">
          <WizardBorderedColumn layoutKey="loading">
            <div className="divide-border divide-y">
              <StepHeader
                title={t('title')}
                description={euRepIntro}
                sideBorders={false}
                contained={false}
                bottomBorder={false}
              />
              <div className="flex flex-1 items-center justify-center py-10">
                <Spinner aria-label={tAccount('loading')} />
              </div>
            </div>
          </WizardBorderedColumn>
        </Container>
      </StepFrame>
    );
  }

  if (matchedContract) {
    return (
      <StepFrame
        scrollWithContent
        footer={
          <StepFooter
            onBack={onBack}
            onContinue={handleContinue}
            ctaLabel={continueCtaLabel}
            showCtaCaret={showContinueCaret}
          />
        }
      >
        <Container className="flex min-h-full flex-1 flex-col">
          <WizardBorderedColumn
            className="divide-border divide-y"
            layoutKey={borderedColumnLayoutKey}
          >
            <StepHeader
              title={t('title')}
              sideBorders={false}
              contained={false}
              bottomBorder={false}
            />
            <EuRepWizardAlreadyCovered contract={matchedContract} />
          </WizardBorderedColumn>
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
            ctaLabel={continueCtaLabel}
            showCtaCaret={showContinueCaret}
          />
        }
      >
        <Container className="flex min-h-full flex-1 flex-col">
          <WizardBorderedColumn layoutKey={borderedColumnLayoutKey}>
            <div className="divide-border divide-y">
              <StepHeader
                title={t('title')}
                description={euRepIntro}
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

              {namedDatenschutzpartner ? (
                <EuRepPartnerFollowUp branch={namedDatenschutzpartner}>
                  {(variant) =>
                    variant === 'covered' ? (
                      <EuRepWizardCoveredSection
                        title={t('gotYouCovered')}
                        body={t('gotYouCoveredRepresentativeIntro')}
                      >
                        <EuRepRepresentativeAddress plain hideTitle />
                      </EuRepWizardCoveredSection>
                    ) : (
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
                            <div
                              ref={euRepThirdPartyRef}
                              className="flex w-full flex-col gap-6 pt-6 lg:w-1/2"
                            >
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
                                    setErrors((current) => ({
                                      ...current,
                                      thirdPartyRepName: undefined,
                                    }));
                                  }}
                                />
                                <FieldErrorText message={errors.thirdPartyRepName} />
                              </div>

                              <PostalAddressFields
                                street={thirdPartyRepStreet}
                                postalCode={thirdPartyRepPostalCode}
                                city={thirdPartyRepCity}
                                onStreetChange={(value) => {
                                  setThirdPartyRepStreet(value);
                                  setErrors((current) => ({
                                    ...current,
                                    thirdPartyRepStreet: undefined,
                                  }));
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
                                  setErrors((current) => ({
                                    ...current,
                                    thirdPartyRepCity: undefined,
                                  }));
                                }}
                                countryDisplayLabel={displayCountryLabel(
                                  thirdPartyRepCountry,
                                  tCommon('countrySwitzerland')
                                )}
                                countryError={errors.thirdPartyRepCountry}
                                showLine2={false}
                                line1Error={errors.thirdPartyRepStreet}
                                postalCodeError={errors.thirdPartyRepPostalCode}
                                cityError={errors.thirdPartyRepCity}
                              />

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
                                    setErrors((current) => ({
                                      ...current,
                                      thirdPartyRepEmail: undefined,
                                    }));
                                  }}
                                />
                                <FieldErrorText message={errors.thirdPartyRepEmail} />
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
                    )
                  }
                </EuRepPartnerFollowUp>
              ) : null}
            </div>

            {namedDatenschutzpartner === 'no' ? (
              <div
                className={cn('flex min-h-0 flex-col overflow-visible', showEuRepOffer && 'flex-1')}
              >
                <Reveal
                  show={Boolean(showEuRepOffer && offerVariant)}
                  fill={showEuRepOffer}
                  overflowVisible
                >
                  <div
                    ref={euRepOfferRef}
                    className="border-border flex min-h-0 flex-1 flex-col overflow-visible border-t"
                  >
                    <div className="flex min-h-0 flex-1 flex-col overflow-visible">
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
                                postalDepartment: undefined,
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
                            setErrors((current) => ({
                              ...current,
                              ...Object.fromEntries(
                                (Object.keys(patch) as Array<keyof EuRepPostalFields>).map(
                                  (key) => [key, undefined]
                                )
                              ),
                            }));
                          }}
                          postalErrors={errors}
                          selectedPlanId={selectedPlanId}
                          onPlanChange={setSelectedPlanId}
                        />
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              </div>
            ) : (
              <div className="min-h-0 flex-1" aria-hidden />
            )}
          </WizardBorderedColumn>
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
