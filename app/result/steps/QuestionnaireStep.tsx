'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import type { z } from 'zod';
import {
  questionnaireFormSchema,
  getGdprBranchVisibility,
  showThirdPartyEuRepQuestion,
} from '@/api/generator';
import { TextInput, RadioGroup, Field } from '../ui/FormSection';
import { CountryAutocomplete } from '../ui/CountryAutocomplete';
import { UidCompanyLookup } from '../ui/UidCompanyLookup';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { StepFrame } from '../ui/StepFrame';
import { Container } from '@/components/shared/Container';
import { MetaBadge } from '@/components/shared/MetaBadge';
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
function CategoryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-border grid grid-cols-1 border-b last:border-b-0 lg:grid-cols-2">
      <div className="border-border border-b p-4 sm:p-8 lg:border-r lg:border-b-0">
        <h2 className="text-muted text-lg leading-snug font-semibold">{label}</h2>
      </div>
      <div className="divide-border flex flex-col divide-y">{children}</div>
    </div>
  );
}
function QField({
  fieldId,
  label,
  hint,
  fieldInfo,
  optional,
  optionalBadgeLabel,
  required,
  requiredBadgeLabel,
  children,
}: {
  fieldId?: keyof QuestionnaireFormData;
  label: string;
  hint?: string;
  fieldInfo?: string;
  optional?: boolean;
  optionalBadgeLabel?: string;
  required?: boolean;
  requiredBadgeLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={fieldId ? `questionnaire-field-${fieldId}` : undefined}
      className="flex flex-col gap-3 px-4 py-4 sm:px-8 sm:py-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          {label}
        </p>
        {optional ? <MetaBadge kind="optional">{optionalBadgeLabel}</MetaBadge> : null}
        {required ? <MetaBadge kind="required">{requiredBadgeLabel}</MetaBadge> : null}
      </div>
      {fieldInfo ? <p className="text-foreground text-sm leading-snug">{fieldInfo}</p> : null}
      {hint ? <p className="text-muted text-xs">{hint}</p> : null}
      {children}
    </div>
  );
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
  const gdprBranch = getGdprBranchVisibility(form);
  const thirdPartyQuestionVisible = showThirdPartyEuRepQuestion(form);

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
      if (!showThirdPartyEuRepQuestion(next)) {
        next.hasThirdPartyEuRep = '';
        next.thirdPartyRepName = '';
        next.thirdPartyRepStreet = '';
        next.thirdPartyRepPostalCode = '';
        next.thirdPartyRepCity = '';
        next.thirdPartyRepCountry = '';
        next.thirdPartyRepEmail = '';
      }
      if (key === 'hasThirdPartyEuRep' && value !== 'yes') {
        next.thirdPartyRepName = '';
        next.thirdPartyRepStreet = '';
        next.thirdPartyRepPostalCode = '';
        next.thirdPartyRepCity = '';
        next.thirdPartyRepCountry = '';
        next.thirdPartyRepEmail = '';
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
          sticky={false}
          onBack={onBack}
          backLabel={backLabel}
          onContinue={handleSubmit}
          ctaLabel={t('continue')}
        />
      }
    >
      <Container>
        <div className="border-border border-r border-l">
          <CategoryRow label={t('categories.controller')}>
            <QField label={t('uidLookup.label')} optional optionalBadgeLabel={optionalBadge}>
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
            </QField>
            <QField
              label={t('fields.companyName')}
              fieldId="companyName"
              required={isRequired('companyName')}
              requiredBadgeLabel={requiredBadge}
            >
              <TextInput
                value={form.companyName}
                onChange={(e) => {
                  set('companyName', e.target.value);
                }}
                placeholder={t('placeholders.companyName')}
              />
            </QField>
            <QField
              label={t('fields.postalAddress')}
              fieldId="street"
              required={isRequired('street', 'postalCode', 'city')}
              requiredBadgeLabel={requiredBadge}
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 sm:flex-[2]">
                    <Field label={t('fields.streetLine1')}>
                      <TextInput
                        value={form.street}
                        onChange={(e) => {
                          set('street', e.target.value);
                        }}
                        placeholder={t('placeholders.street')}
                      />
                    </Field>
                  </div>
                  <div className="min-w-0 sm:flex-1">
                    <TextInput
                      value={form.postalCode}
                      onChange={(e) => {
                        set('postalCode', e.target.value);
                      }}
                      placeholder={t('placeholders.postalCode')}
                    />
                  </div>
                  <div className="min-w-0 sm:flex-1">
                    <TextInput
                      value={form.city}
                      onChange={(e) => {
                        set('city', e.target.value);
                      }}
                      placeholder={t('placeholders.city')}
                    />
                  </div>
                </div>
              </div>
            </QField>
            <QField
              label={t('fields.streetLine2')}
              fieldId="streetLine2"
              optional
              optionalBadgeLabel={optionalBadge}
            >
              <TextInput
                value={form.streetLine2}
                onChange={(e) => {
                  set('streetLine2', e.target.value);
                }}
              />
            </QField>
            <QField
              label={t('fields.email')}
              fieldId="email"
              required={isRequired('email')}
              requiredBadgeLabel={requiredBadge}
            >
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => {
                  set('email', e.target.value);
                }}
                placeholder={t('placeholders.email')}
              />
            </QField>
            <QField
              label={t('fields.hasDpo')}
              fieldId="hasDpo"
              fieldInfo={t('fieldInfo.hasDpo')}
              required={isRequired('hasDpo')}
              requiredBadgeLabel={requiredBadge}
            >
              <RadioGroup
                name="hasDpo"
                options={yesNo}
                value={form.hasDpo}
                onChange={(v) => {
                  set('hasDpo', v);
                }}
              />
              <Reveal show={form.hasDpo === 'yes'}>
                <div className="flex flex-col gap-4 pt-1">
                  <QField
                    label={t('fields.dpoCompanyName')}
                    fieldId="dpoCompanyName"
                    required={isRequired('dpoCompanyName')}
                    requiredBadgeLabel={requiredBadge}
                  >
                    <TextInput
                      value={form.dpoCompanyName}
                      onChange={(e) => {
                        set('dpoCompanyName', e.target.value);
                      }}
                    />
                  </QField>
                  <QField
                    label={t('fields.dpoOfficerType')}
                    fieldInfo={t('fieldInfo.dpoDesignation')}
                    optional
                    optionalBadgeLabel={optionalBadge}
                  >
                    <TextInput
                      value={form.dpoDesignation}
                      onChange={(e) => {
                        set('dpoDesignation', e.target.value);
                      }}
                    />
                  </QField>
                  <QField
                    label={t('fields.address')}
                    fieldId="dpoStreet"
                    required={isRequired('dpoStreet', 'dpoPostalCode', 'dpoCity')}
                    requiredBadgeLabel={requiredBadge}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 sm:flex-[2]">
                        <TextInput
                          value={form.dpoStreet}
                          onChange={(e) => {
                            set('dpoStreet', e.target.value);
                          }}
                          placeholder={t('placeholders.street')}
                        />
                      </div>
                      <div className="min-w-0 sm:flex-1">
                        <TextInput
                          value={form.dpoPostalCode}
                          onChange={(e) => {
                            set('dpoPostalCode', e.target.value);
                          }}
                          placeholder={t('placeholders.postalCode')}
                        />
                      </div>
                      <div className="min-w-0 sm:flex-1">
                        <TextInput
                          value={form.dpoCity}
                          onChange={(e) => {
                            set('dpoCity', e.target.value);
                          }}
                          placeholder={t('placeholders.city')}
                        />
                      </div>
                    </div>
                  </QField>
                  <QField
                    label={t('fields.dpoCountry')}
                    fieldId="dpoCountry"
                    required={isRequired('dpoCountry')}
                    requiredBadgeLabel={requiredBadge}
                  >
                    <CountryAutocomplete
                      value={form.dpoCountry}
                      onChange={(next) => {
                        set('dpoCountry', next);
                      }}
                    />
                  </QField>
                </div>
              </Reveal>
            </QField>
          </CategoryRow>
          <CategoryRow label={t('categories.internationalization')}>
            <QField
              label={t('fields.gdprApplicable')}
              fieldId="gdprApplicable"
              fieldInfo={t('fieldInfo.gdprApplicable')}
              required={isRequired('gdprApplicable')}
              requiredBadgeLabel={requiredBadge}
            >
              <RadioGroup
                name="gdprApplicable"
                options={yesNoDontKnow}
                value={form.gdprApplicable}
                onChange={(v) => {
                  set('gdprApplicable', v);
                }}
              />
            </QField>
            {gdprBranch.showEeaOffer ? (
              <QField
                label={t('fields.offersToEU')}
                fieldId="offersToEU"
                required={isRequired('offersToEU')}
                requiredBadgeLabel={requiredBadge}
              >
                <RadioGroup
                  name="offersToEU"
                  options={yesNo}
                  value={form.offersToEU}
                  onChange={(v) => {
                    set('offersToEU', v);
                  }}
                />
              </QField>
            ) : null}
            {gdprBranch.showEeaMonitoring ? (
              <QField
                label={t('fields.monitorsEUBehaviour')}
                fieldId="monitorsEUBehaviour"
                required={isRequired('monitorsEUBehaviour')}
                requiredBadgeLabel={requiredBadge}
              >
                <RadioGroup
                  name="monitorsEUBehaviour"
                  options={yesNo}
                  value={form.monitorsEUBehaviour}
                  onChange={(v) => {
                    set('monitorsEUBehaviour', v);
                  }}
                />
              </QField>
            ) : null}
            <QField
              label={t('fields.transfersAbroad')}
              fieldId="transfersAbroad"
              required={isRequired('transfersAbroad')}
              requiredBadgeLabel={requiredBadge}
            >
              <RadioGroup
                name="transfersAbroad"
                options={TRANSFERS_ABROAD_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: t(`options.transfersAbroad.${opt.value}`),
                }))}
                value={form.transfersAbroad}
                onChange={(v) => {
                  set('transfersAbroad', v);
                }}
              />
            </QField>
            <Reveal show={thirdPartyQuestionVisible}>
              <QField
                label={t('fields.hasThirdPartyEuRep')}
                fieldId="hasThirdPartyEuRep"
                required={isRequired('hasThirdPartyEuRep')}
                requiredBadgeLabel={requiredBadge}
              >
                <RadioGroup
                  name="hasThirdPartyEuRep"
                  options={yesNo}
                  value={form.hasThirdPartyEuRep}
                  onChange={(v) => {
                    set('hasThirdPartyEuRep', v);
                  }}
                />
                <Reveal show={form.hasThirdPartyEuRep === 'yes'}>
                  <div className="flex flex-col gap-4 pt-1">
                    <QField
                      label={t('fields.thirdPartyRepName')}
                      fieldId="thirdPartyRepName"
                      required={isRequired('thirdPartyRepName')}
                      requiredBadgeLabel={requiredBadge}
                    >
                      <TextInput
                        value={form.thirdPartyRepName}
                        onChange={(e) => {
                          set('thirdPartyRepName', e.target.value);
                        }}
                        placeholder={t('placeholders.thirdPartyRepName')}
                      />
                    </QField>
                    <QField
                      label={t('fields.thirdPartyRepAddress')}
                      fieldId="thirdPartyRepStreet"
                      required={isRequired(
                        'thirdPartyRepStreet',
                        'thirdPartyRepPostalCode',
                        'thirdPartyRepCity'
                      )}
                      requiredBadgeLabel={requiredBadge}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="min-w-0 sm:flex-[2]">
                          <TextInput
                            value={form.thirdPartyRepStreet}
                            onChange={(e) => {
                              set('thirdPartyRepStreet', e.target.value);
                            }}
                            placeholder={t('placeholders.street')}
                          />
                        </div>
                        <div className="min-w-0 sm:flex-1">
                          <TextInput
                            value={form.thirdPartyRepPostalCode}
                            onChange={(e) => {
                              set('thirdPartyRepPostalCode', e.target.value);
                            }}
                            placeholder={t('placeholders.postalCode')}
                          />
                        </div>
                        <div className="min-w-0 sm:flex-1">
                          <TextInput
                            value={form.thirdPartyRepCity}
                            onChange={(e) => {
                              set('thirdPartyRepCity', e.target.value);
                            }}
                            placeholder={t('placeholders.city')}
                          />
                        </div>
                      </div>
                    </QField>
                    <QField
                      label={t('fields.thirdPartyRepCountry')}
                      fieldId="thirdPartyRepCountry"
                      required={isRequired('thirdPartyRepCountry')}
                      requiredBadgeLabel={requiredBadge}
                    >
                      <CountryAutocomplete
                        value={form.thirdPartyRepCountry}
                        placeholder={t('placeholders.select')}
                        onChange={(next) => {
                          set('thirdPartyRepCountry', next);
                        }}
                      />
                    </QField>
                    <QField
                      label={t('fields.thirdPartyRepEmail')}
                      fieldId="thirdPartyRepEmail"
                      required={isRequired('thirdPartyRepEmail')}
                      requiredBadgeLabel={requiredBadge}
                    >
                      <TextInput
                        type="email"
                        value={form.thirdPartyRepEmail}
                        onChange={(e) => {
                          set('thirdPartyRepEmail', e.target.value);
                        }}
                      />
                    </QField>
                  </div>
                </Reveal>
              </QField>
            </Reveal>
          </CategoryRow>
          <CategoryRow label={t('categories.specialRisks')}>
            <QField
              label={t('fields.usesProfiling')}
              fieldId="usesProfiling"
              fieldInfo={t('fieldInfo.usesProfiling')}
              required={isRequired('usesProfiling')}
              requiredBadgeLabel={requiredBadge}
            >
              <RadioGroup
                name="usesProfiling"
                options={yesNoDontKnow}
                value={form.usesProfiling}
                onChange={(v) => {
                  set('usesProfiling', v);
                }}
              />
            </QField>
            <QField
              label={t('fields.processesSpecialData')}
              fieldId="processesSpecialData"
              fieldInfo={t('fieldInfo.processesSpecialData')}
              required={isRequired('processesSpecialData')}
              requiredBadgeLabel={requiredBadge}
            >
              <RadioGroup
                name="processesSpecialData"
                options={yesNoDontKnow}
                value={form.processesSpecialData}
                onChange={(v) => {
                  set('processesSpecialData', v);
                }}
              />
            </QField>
          </CategoryRow>
          <CategoryRow label={t('categories.artificialIntelligence')}>
            <QField
              label={t('fields.usesAiProcessing')}
              fieldId="usesAiProcessing"
              required={isRequired('usesAiProcessing')}
              requiredBadgeLabel={requiredBadge}
            >
              <RadioGroup
                name="usesAiProcessing"
                options={yesNo}
                value={form.usesAiProcessing}
                onChange={(v) => {
                  set('usesAiProcessing', v);
                }}
              />
            </QField>
          </CategoryRow>
          <CategoryRow label={t('categories.humanResources')}>
            <QField
              label={t('fields.acceptsApplications')}
              fieldId="acceptsApplications"
              required={isRequired('acceptsApplications')}
              requiredBadgeLabel={requiredBadge}
            >
              <RadioGroup
                name="acceptsApplications"
                options={yesNo}
                value={form.acceptsApplications}
                onChange={(v) => {
                  set('acceptsApplications', v);
                }}
              />
            </QField>
            <Reveal show={form.acceptsApplications === 'yes'}>
              <QField label={t('fields.hasTalentPool')} optional optionalBadgeLabel={optionalBadge}>
                <RadioGroup
                  name="hasTalentPool"
                  options={yesNo}
                  value={form.hasTalentPool}
                  onChange={(v) => {
                    set('hasTalentPool', v);
                  }}
                />
              </QField>
            </Reveal>
          </CategoryRow>
          <CategoryRow label={t('categories.videoSurveillance')}>
            <QField
              label={t('fields.usesVideoSurveillance')}
              fieldId="usesVideoSurveillance"
              required={isRequired('usesVideoSurveillance')}
              requiredBadgeLabel={requiredBadge}
            >
              <RadioGroup
                name="usesVideoSurveillance"
                options={yesNo}
                value={form.usesVideoSurveillance}
                onChange={(v) => {
                  set('usesVideoSurveillance', v);
                }}
              />
            </QField>
            <Reveal show={form.usesVideoSurveillance === 'yes'}>
              <QField
                label={t('fields.videoRetention')}
                fieldId="videoRetention"
                required={isRequired('videoRetention')}
                requiredBadgeLabel={requiredBadge}
              >
                <RadioGroup
                  name="videoRetention"
                  options={VIDEO_RETENTION_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: t(`options.videoRetention.${opt.value}`),
                  }))}
                  value={form.videoRetention}
                  onChange={(v) => {
                    set('videoRetention', v);
                  }}
                />
              </QField>
              <Reveal show={form.videoRetention === 'duration'}>
                <QField
                  label={t('fields.videoRetentionDuration')}
                  fieldId="videoRetentionAmount"
                  required={isRequired('videoRetentionAmount', 'videoRetentionUnit')}
                  requiredBadgeLabel={requiredBadge}
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
                </QField>
              </Reveal>
            </Reveal>
          </CategoryRow>
        </div>
      </Container>
    </StepFrame>
  );
}
