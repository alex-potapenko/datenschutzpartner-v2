'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import type { z } from 'zod';
import { questionnaireFormSchema, getGdprBranchVisibility } from '@/api/generator';
import { TextInput, RadioGroup } from '../ui/FormSection';
import { UidCompanyLookup } from '../ui/UidCompanyLookup';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { StepFrame } from '../ui/StepFrame';
import { Container } from '@/components/shared/Container';
import { WizardQuestionCategory } from '../ui/WizardQuestionCategory';
import { WizardQuestionRow } from '../ui/WizardQuestionRow';
import {
  type QuestionnaireFormData,
  TRANSFERS_ABROAD_OPTIONS,
  VIDEO_RETENTION_OPTIONS,
} from '../content/questionnaire-form';
export type { QuestionnaireFormData };
interface QuestionnaireStepProps {
  domain: string;
  onSubmit: (data: QuestionnaireFormData) => void;
  onBack?: () => void;
  backLabel?: string;
  initialData?: Partial<QuestionnaireFormData>;
}
function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="reveal"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-visible"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function fieldId(field?: keyof QuestionnaireFormData) {
  return field ? `questionnaire-field-${field}` : undefined;
}
function issuesToRequiredFields(issues: z.core.$ZodIssue[]): Set<keyof QuestionnaireFormData> {
  const fields = new Set<keyof QuestionnaireFormData>();
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fields.add(key as keyof QuestionnaireFormData);
    }
  }
  return fields;
}
function scrollToFirstIssue(issues: z.core.$ZodIssue[]) {
  const firstField = issues[0]?.path[0];
  if (typeof firstField !== 'string') return;
  requestAnimationFrame(() => {
    document
      .getElementById(`questionnaire-field-${firstField}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
type LegacyQuestionnaireFormData = Partial<QuestionnaireFormData> & {
  dpoFirstName?: string;
  dpoLastName?: string;
  dpoOfficerType?: string;
};
function resolveDpoDesignation(initial?: LegacyQuestionnaireFormData): string {
  if (initial?.dpoDesignation) return initial.dpoDesignation;
  return [initial?.dpoFirstName, initial?.dpoLastName].filter(Boolean).join(' ').trim();
}
function emptyForm(
  domain: string,
  companyName: string,
  initialData?: LegacyQuestionnaireFormData,
  defaults?: { dpoDesignation: string; country: string }
): QuestionnaireFormData {
  const { domain: initialDomain, ...rawRest } = initialData ?? {};
  const restInitial = { ...rawRest };
  delete restInitial.dpoFirstName;
  delete restInitial.dpoLastName;
  delete restInitial.dpoOfficerType;
  return {
    companyName,
    domain: initialDomain ?? domain,
    email: `info@${domain}`,
    street: '',
    streetLine2: '',
    postalCode: '',
    city: '',
    country: defaults?.country ?? 'Schweiz',
    hasDpo: '',
    dpoCompanyName: '',
    dpoDesignation: resolveDpoDesignation(initialData) || defaults?.dpoDesignation || '',
    dpoStreet: '',
    dpoPostalCode: '',
    dpoCity: '',
    dpoCountry: '',
    dpoEmail: '',
    gdprApplicable: '',
    offersToEU: '',
    monitorsEUBehaviour: '',
    transfersAbroad: '',
    usesProfiling: '',
    processesSpecialData: '',
    specialDataCategories: [],
    usesAiProcessing: '',
    acceptsApplications: '',
    hasTalentPool: '',
    usesVideoSurveillance: '',
    videoRetention: '',
    videoRetentionAmount: '',
    videoRetentionUnit: '',
    hasThirdPartyEuRep: '',
    thirdPartyRepName: '',
    thirdPartyRepStreet: '',
    thirdPartyRepPostalCode: '',
    thirdPartyRepCity: '',
    thirdPartyRepCountry: '',
    thirdPartyRepEmail: '',
    basedInSwitzerland: 'yes',
    ...restInitial,
  };
}
export function QuestionnaireStep({
  domain,
  onSubmit,
  onBack,
  backLabel,
  initialData,
}: QuestionnaireStepProps) {
  const t = useTranslations('result.questionnaireStep');
  const tEuRepQ = useTranslations('euRepQuestionnaire');
  const optionalBadge = t('optionalBadge');
  const requiredBadge = t('requiredBadge');
  const companyGuess = domain.replace(/^www\./, '').split('.')[0] ?? domain;
  const companyName = companyGuess.charAt(0).toUpperCase() + companyGuess.slice(1);
  const [form, setForm] = useState<QuestionnaireFormData>(() =>
    emptyForm(domain, companyName, initialData, {
      dpoDesignation: t('defaults.dpoDesignation'),
      country: t('defaults.country'),
    })
  );
  const [requiredFields, setRequiredFields] = useState<Set<keyof QuestionnaireFormData>>(new Set());
  const [validationAttempt, setValidationAttempt] = useState(0);
  const gdprBranch = getGdprBranchVisibility(form);

  function isRequired(...keys: (keyof QuestionnaireFormData)[]) {
    return keys.some((key) => requiredFields.has(key));
  }

  function clearRequired(...keys: (keyof QuestionnaireFormData)[]) {
    setRequiredFields((prev) => {
      if (!keys.some((key) => prev.has(key))) return prev;
      const next = new Set(prev);
      for (const key of keys) {
        next.delete(key);
      }
      return next;
    });
  }
  const yesNo = [
    { value: 'yes', label: tEuRepQ('yes') },
    { value: 'no', label: tEuRepQ('no') },
  ];
  const yesNoDontKnow = [
    { value: 'yes', label: tEuRepQ('yes') },
    { value: 'no', label: tEuRepQ('no') },
    { value: 'dontknow', label: tEuRepQ('dontknow') },
  ];
  function set<K extends keyof QuestionnaireFormData>(key: K, value: QuestionnaireFormData[K]) {
    clearRequired(key);
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'gdprApplicable') {
        next.offersToEU = '';
        next.monitorsEUBehaviour = '';
      }
      if (key === 'offersToEU') {
        next.monitorsEUBehaviour = '';
      }
      if (key === 'hasDpo' && value !== 'yes') {
        next.dpoCompanyName = '';
        next.dpoDesignation = '';
        next.dpoStreet = '';
        next.dpoPostalCode = '';
        next.dpoCity = '';
        next.dpoCountry = '';
        next.dpoEmail = '';
      }
      if (key === 'hasDpo' && value === 'yes') {
        next.dpoCompanyName = prev.dpoCompanyName.trim() || prev.companyName;
        next.dpoDesignation = prev.dpoDesignation.trim() || t('defaults.dpoDesignation');
        next.dpoCountry = prev.dpoCountry.trim() || t('defaults.country');
      }
      if (key === 'processesSpecialData' && value !== 'yes') {
        next.specialDataCategories = [];
      }
      if (key === 'acceptsApplications' && value !== 'yes') {
        next.hasTalentPool = '';
      }
      if (key === 'usesVideoSurveillance' && value !== 'yes') {
        next.videoRetention = '';
        next.videoRetentionAmount = '';
        next.videoRetentionUnit = '';
      }
      if (key === 'videoRetention' && value !== 'duration') {
        next.videoRetentionAmount = '';
        next.videoRetentionUnit = '';
      }
      return next;
    });
  }
  function handleSubmit() {
    const result = questionnaireFormSchema.safeParse(form);
    if (!result.success) {
      setRequiredFields(issuesToRequiredFields(result.error.issues));
      setValidationAttempt((count) => count + 1);
      scrollToFirstIssue(result.error.issues);
      return;
    }
    setRequiredFields(new Set());
    onSubmit(result.data);
  }
  return (
    <StepFrame
      scrollWithContent
      header={<StepHeader title={t('title')} />}
      footer={
        <StepFooter
          onBack={onBack}
          backLabel={backLabel}
          onContinue={handleSubmit}
          ctaLabel={t('continue')}
        />
      }
    >
      <Container>
        <div className="border-border border-r border-l">
          <WizardQuestionCategory label={t('categories.controller')}>
            <WizardQuestionRow
              label={t('uidLookup.label')}
              optional
              optionalBadgeLabel={optionalBadge}
            >
              <UidCompanyLookup
                onSelect={(company) => {
                  clearRequired('companyName', 'street', 'postalCode', 'city');
                  setForm((current) => ({
                    ...current,
                    companyName: company.name,
                    street: company.street,
                    postalCode: company.postalCode,
                    city: company.city,
                    country: company.country,
                  }));
                }}
              />
            </WizardQuestionRow>
            <WizardQuestionRow
              variant="text"
              id={fieldId('companyName')}
              label={t('fields.companyName')}
              value={form.companyName}
              required={isRequired('companyName')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              placeholder={t('placeholders.companyName')}
              onChange={(e) => {
                set('companyName', e.target.value);
              }}
            />
            <WizardQuestionRow
              variant="address"
              id={fieldId('street')}
              label={t('fields.address')}
              required={isRequired('street', 'postalCode', 'city')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              optionalBadgeLabel={optionalBadge}
              idPrefix="questionnaire-field"
              street={form.street}
              streetLine2={form.streetLine2}
              postalCode={form.postalCode}
              city={form.city}
              onStreetChange={(value) => {
                set('street', value);
              }}
              onStreetLine2Change={(value) => {
                set('streetLine2', value);
              }}
              onPostalCodeChange={(value) => {
                set('postalCode', value);
              }}
              onCityChange={(value) => {
                set('city', value);
              }}
            />
            <WizardQuestionRow
              variant="text"
              id={fieldId('email')}
              label={t('fields.email')}
              inputType="email"
              value={form.email}
              required={isRequired('email')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              placeholder={t('placeholders.email')}
              onChange={(e) => {
                set('email', e.target.value);
              }}
            />
            <WizardQuestionRow
              variant="choices"
              id={fieldId('hasDpo')}
              name="hasDpo"
              label={t('fields.hasDpo')}
              description={t('fieldInfo.hasDpo')}
              options={yesNo}
              value={form.hasDpo}
              required={isRequired('hasDpo')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              onChange={(v) => {
                set('hasDpo', v);
              }}
              followUp={
                <Reveal show={form.hasDpo === 'yes'}>
                  <div className="flex flex-col gap-4 pt-1">
                    <WizardQuestionRow
                      compact
                      variant="text"
                      id={fieldId('dpoCompanyName')}
                      label={t('fields.dpoCompanyName')}
                      value={form.dpoCompanyName}
                      required={isRequired('dpoCompanyName')}
                      requiredBadgeLabel={requiredBadge}
                      requiredShakeKey={validationAttempt}
                      onChange={(e) => {
                        set('dpoCompanyName', e.target.value);
                      }}
                    />
                    <WizardQuestionRow
                      compact
                      variant="text"
                      label={t('fields.dpoOfficerType')}
                      description={t('fieldInfo.dpoDesignation')}
                      value={form.dpoDesignation}
                      optional
                      optionalBadgeLabel={optionalBadge}
                      onChange={(e) => {
                        set('dpoDesignation', e.target.value);
                      }}
                    />
                    <WizardQuestionRow
                      compact
                      variant="address"
                      id={fieldId('dpoStreet')}
                      label={t('fields.address')}
                      required={isRequired('dpoStreet', 'dpoPostalCode', 'dpoCity')}
                      requiredBadgeLabel={requiredBadge}
                      requiredShakeKey={validationAttempt}
                      showLine2={false}
                      street={form.dpoStreet}
                      postalCode={form.dpoPostalCode}
                      city={form.dpoCity}
                      onStreetChange={(value) => {
                        set('dpoStreet', value);
                      }}
                      onPostalCodeChange={(value) => {
                        set('dpoPostalCode', value);
                      }}
                      onCityChange={(value) => {
                        set('dpoCity', value);
                      }}
                    />
                    <WizardQuestionRow
                      compact
                      id={fieldId('dpoCountry')}
                      label={t('fields.dpoCountry')}
                    >
                      <p className="text-foreground text-sm leading-relaxed">
                        {t('defaults.country')}
                      </p>
                    </WizardQuestionRow>
                  </div>
                </Reveal>
              }
            />
          </WizardQuestionCategory>
          <WizardQuestionCategory label={t('categories.internationalization')}>
            <WizardQuestionRow
              variant="choices"
              id={fieldId('gdprApplicable')}
              name="gdprApplicable"
              label={t('fields.gdprApplicable')}
              description={t('fieldInfo.gdprApplicable')}
              options={yesNoDontKnow}
              value={form.gdprApplicable}
              required={isRequired('gdprApplicable')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              onChange={(v) => {
                set('gdprApplicable', v);
              }}
            />
            {gdprBranch.showEeaOffer ? (
              <WizardQuestionRow
                variant="choices"
                id={fieldId('offersToEU')}
                name="offersToEU"
                label={t('fields.offersToEU')}
                options={yesNo}
                value={form.offersToEU}
                required={isRequired('offersToEU')}
                requiredBadgeLabel={requiredBadge}
                requiredShakeKey={validationAttempt}
                onChange={(v) => {
                  set('offersToEU', v);
                }}
              />
            ) : null}
            {gdprBranch.showEeaMonitoring ? (
              <WizardQuestionRow
                variant="choices"
                id={fieldId('monitorsEUBehaviour')}
                name="monitorsEUBehaviour"
                label={t('fields.monitorsEUBehaviour')}
                options={yesNo}
                value={form.monitorsEUBehaviour}
                required={isRequired('monitorsEUBehaviour')}
                requiredBadgeLabel={requiredBadge}
                requiredShakeKey={validationAttempt}
                onChange={(v) => {
                  set('monitorsEUBehaviour', v);
                }}
              />
            ) : null}
            <WizardQuestionRow
              variant="choices"
              id={fieldId('transfersAbroad')}
              name="transfersAbroad"
              label={t('fields.transfersAbroad')}
              options={TRANSFERS_ABROAD_OPTIONS.map((opt) => ({
                value: opt.value,
                label: t(`options.transfersAbroad.${opt.value}`),
              }))}
              value={form.transfersAbroad}
              required={isRequired('transfersAbroad')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              onChange={(v) => {
                set('transfersAbroad', v);
              }}
            />
          </WizardQuestionCategory>
          <WizardQuestionCategory label={t('categories.specialRisks')}>
            <WizardQuestionRow
              variant="choices"
              id={fieldId('usesProfiling')}
              name="usesProfiling"
              label={t('fields.usesProfiling')}
              description={t('fieldInfo.usesProfiling')}
              options={yesNoDontKnow}
              value={form.usesProfiling}
              required={isRequired('usesProfiling')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              onChange={(v) => {
                set('usesProfiling', v);
              }}
            />
            <WizardQuestionRow
              variant="choices"
              id={fieldId('processesSpecialData')}
              name="processesSpecialData"
              label={t('fields.processesSpecialData')}
              description={t('fieldInfo.processesSpecialData')}
              options={yesNoDontKnow}
              value={form.processesSpecialData}
              required={isRequired('processesSpecialData')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              onChange={(v) => {
                set('processesSpecialData', v);
              }}
            />
          </WizardQuestionCategory>
          <WizardQuestionCategory label={t('categories.artificialIntelligence')}>
            <WizardQuestionRow
              variant="choices"
              id={fieldId('usesAiProcessing')}
              name="usesAiProcessing"
              label={t('fields.usesAiProcessing')}
              options={yesNo}
              value={form.usesAiProcessing}
              required={isRequired('usesAiProcessing')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              onChange={(v) => {
                set('usesAiProcessing', v);
              }}
            />
          </WizardQuestionCategory>
          <WizardQuestionCategory label={t('categories.humanResources')}>
            <WizardQuestionRow
              variant="choices"
              id={fieldId('acceptsApplications')}
              name="acceptsApplications"
              label={t('fields.acceptsApplications')}
              options={yesNo}
              value={form.acceptsApplications}
              required={isRequired('acceptsApplications')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              onChange={(v) => {
                set('acceptsApplications', v);
              }}
            />
            <Reveal show={form.acceptsApplications === 'yes'}>
              <WizardQuestionRow
                variant="choices"
                name="hasTalentPool"
                label={t('fields.hasTalentPool')}
                options={yesNo}
                value={form.hasTalentPool}
                optional
                optionalBadgeLabel={optionalBadge}
                onChange={(v) => {
                  set('hasTalentPool', v);
                }}
              />
            </Reveal>
          </WizardQuestionCategory>
          <WizardQuestionCategory label={t('categories.videoSurveillance')}>
            <WizardQuestionRow
              variant="choices"
              id={fieldId('usesVideoSurveillance')}
              name="usesVideoSurveillance"
              label={t('fields.usesVideoSurveillance')}
              options={yesNo}
              value={form.usesVideoSurveillance}
              required={isRequired('usesVideoSurveillance')}
              requiredBadgeLabel={requiredBadge}
              requiredShakeKey={validationAttempt}
              onChange={(v) => {
                set('usesVideoSurveillance', v);
              }}
            />
            <Reveal show={form.usesVideoSurveillance === 'yes'}>
              <WizardQuestionRow
                variant="choices"
                id={fieldId('videoRetention')}
                name="videoRetention"
                label={t('fields.videoRetention')}
                options={VIDEO_RETENTION_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: t(`options.videoRetention.${opt.value}`),
                }))}
                value={form.videoRetention}
                required={isRequired('videoRetention')}
                requiredBadgeLabel={requiredBadge}
                requiredShakeKey={validationAttempt}
                onChange={(v) => {
                  set('videoRetention', v);
                }}
              />
              <Reveal show={form.videoRetention === 'duration'}>
                <WizardQuestionRow
                  id={fieldId('videoRetentionAmount')}
                  label={t('fields.videoRetentionDuration')}
                  required={isRequired('videoRetentionAmount', 'videoRetentionUnit')}
                  requiredBadgeLabel={requiredBadge}
                  requiredShakeKey={validationAttempt}
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <TextInput
                      value={form.videoRetentionAmount}
                      onChange={(e) => {
                        set('videoRetentionAmount', e.target.value);
                      }}
                      placeholder={t('placeholders.videoRetentionAmount')}
                      className="sm:flex-1"
                    />
                    <RadioGroup
                      name="videoRetentionUnit"
                      options={[
                        { value: 'hours', label: t('options.videoRetentionUnit.hours') },
                        { value: 'days', label: t('options.videoRetentionUnit.days') },
                      ]}
                      value={form.videoRetentionUnit}
                      onChange={(v) => {
                        set('videoRetentionUnit', v);
                      }}
                    />
                  </div>
                </WizardQuestionRow>
              </Reveal>
            </Reveal>
          </WizardQuestionCategory>
        </div>
      </Container>
    </StepFrame>
  );
}
