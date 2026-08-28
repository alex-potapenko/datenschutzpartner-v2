'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import {
  improvedFormSchema,
  getGdprBranchVisibility,
  showThirdPartyEuRepQuestion,
} from '@/api/generator';
import { TextInput, RadioGroup, CheckboxField, Field } from '../ui/FormSection';
import { UidCompanyLookup } from '../ui/UidCompanyLookup';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { StepFrame } from '../ui/StepFrame';
import { Container } from '@/components/shared/Container';
import {
  type ImprovedFormData,
  SPECIAL_DATA_OPTIONS,
  TRANSFERS_ABROAD_OPTIONS,
  VIDEO_RETENTION_OPTIONS,
} from '../content/improved-form';
import { isWizardValidationSkipped } from '@/lib/wizard-debug';

export type { ImprovedFormData };

interface ImprovedStepProps {
  domain: string;
  onSubmit: (data: ImprovedFormData) => void;
  onBack?: () => void;
  backLabel?: string;
  initialData?: Partial<ImprovedFormData>;
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
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:px-8 sm:py-6">
      <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
        {label}
      </p>
      {hint && <p className="text-muted text-xs">{hint}</p>}
      {children}
    </div>
  );
}

function emptyForm(
  domain: string,
  companyName: string,
  initialData?: Partial<ImprovedFormData>
): ImprovedFormData {
  const { domain: initialDomain, ...restInitial } = initialData ?? {};
  return {
    companyName,
    domain: initialDomain ?? domain,
    email: `info@${domain}`,
    street: '',
    postalCode: '',
    city: '',
    country: 'Schweiz',
    hasDpo: '',
    dpoCompanyName: '',
    dpoFirstName: '',
    dpoLastName: '',
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

export function ImprovedStep({
  domain,
  onSubmit,
  onBack,
  backLabel,
  initialData,
}: ImprovedStepProps) {
  const t = useTranslations('result.improvedStep');
  const tEuRepQ = useTranslations('euRepQuestionnaire');
  const tValidation = useTranslations('validation');

  const companyGuess = domain.replace(/^www\./, '').split('.')[0] ?? domain;
  const companyName = companyGuess.charAt(0).toUpperCase() + companyGuess.slice(1);

  const [form, setForm] = useState<ImprovedFormData>(() =>
    emptyForm(domain, companyName, initialData)
  );

  const gdprBranch = getGdprBranchVisibility(form);
  const thirdPartyQuestionVisible = showThirdPartyEuRepQuestion(form);

  const yesNo = [
    { value: 'yes', label: tEuRepQ('yes') },
    { value: 'no', label: tEuRepQ('no') },
  ];

  const yesNoDontKnow = [
    { value: 'yes', label: tEuRepQ('yes') },
    { value: 'no', label: tEuRepQ('no') },
    { value: 'dontknow', label: tEuRepQ('dontknow') },
  ];

  function set<K extends keyof ImprovedFormData>(key: K, value: ImprovedFormData[K]) {
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
        next.dpoFirstName = '';
        next.dpoLastName = '';
        next.dpoStreet = '';
        next.dpoPostalCode = '';
        next.dpoCity = '';
        next.dpoCountry = '';
        next.dpoEmail = '';
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

  function toggleSpecialData(value: string) {
    setForm((prev) => ({
      ...prev,
      specialDataCategories: prev.specialDataCategories.includes(value)
        ? prev.specialDataCategories.filter((v) => v !== value)
        : [...prev.specialDataCategories, value],
    }));
  }

  function handleSubmit() {
    if (isWizardValidationSkipped()) {
      onSubmit(form);
      return;
    }

    const result = improvedFormSchema.safeParse(form);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const messageKey = firstIssue?.message;
      toast.error(
        messageKey && messageKey.startsWith('validation.')
          ? tValidation(messageKey.replace('validation.', '') as 'required' | 'email')
          : t('validationError')
      );
      return;
    }
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
            <QField label={t('uidLookup.label')}>
              <UidCompanyLookup
                onSelect={(company) => {
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
            <QField label={t('fields.companyName')}>
              <TextInput
                value={form.companyName}
                onChange={(e) => {
                  set('companyName', e.target.value);
                }}
                placeholder={t('placeholders.companyName')}
              />
            </QField>
            <QField label={t('fields.postalAddress')}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 sm:flex-[2]">
                  <TextInput
                    value={form.street}
                    onChange={(e) => {
                      set('street', e.target.value);
                    }}
                    placeholder={t('placeholders.street')}
                  />
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
            </QField>
            <QField label={t('fields.email')}>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => {
                  set('email', e.target.value);
                }}
                placeholder={t('placeholders.email')}
              />
            </QField>
            <QField label={t('fields.hasDpo')}>
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
                  <Field label={t('fields.dpoCompanyName')}>
                    <TextInput
                      value={form.dpoCompanyName}
                      onChange={(e) => {
                        set('dpoCompanyName', e.target.value);
                      }}
                    />
                  </Field>
                  <Field label={t('fields.dpoOfficer')}>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <TextInput
                        value={form.dpoFirstName}
                        onChange={(e) => {
                          set('dpoFirstName', e.target.value);
                        }}
                        placeholder={t('placeholders.firstName')}
                        className="sm:flex-1"
                      />
                      <TextInput
                        value={form.dpoLastName}
                        onChange={(e) => {
                          set('dpoLastName', e.target.value);
                        }}
                        placeholder={t('placeholders.lastName')}
                        className="sm:flex-1"
                      />
                    </div>
                  </Field>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 sm:flex-[2]">
                      <Field label={t('fields.address')}>
                        <TextInput
                          value={form.dpoStreet}
                          onChange={(e) => {
                            set('dpoStreet', e.target.value);
                          }}
                          placeholder={t('placeholders.street')}
                        />
                      </Field>
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
                  <Field label={t('fields.dpoCountry')}>
                    <TextInput
                      value={form.dpoCountry}
                      onChange={(e) => {
                        set('dpoCountry', e.target.value);
                      }}
                      placeholder={t('placeholders.country')}
                    />
                  </Field>
                </div>
              </Reveal>
            </QField>
          </CategoryRow>

          <CategoryRow label={t('categories.internationalization')}>
            <QField label={t('fields.gdprApplicable')}>
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
              <QField label={t('fields.offersToEU')}>
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
              <QField label={t('fields.monitorsEUBehaviour')}>
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
            <QField label={t('fields.transfersAbroad')}>
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
            {thirdPartyQuestionVisible ? (
              <QField label={t('fields.hasThirdPartyEuRep')}>
                <RadioGroup
                  name="hasThirdPartyEuRep"
                  options={yesNo}
                  value={form.hasThirdPartyEuRep}
                  onChange={(v) => {
                    set('hasThirdPartyEuRep', v);
                  }}
                />
                <Reveal show={form.hasThirdPartyEuRep === 'yes'}>
                  <div className="flex flex-col gap-4 pt-2">
                    <Field label={t('fields.thirdPartyRepName')}>
                      <TextInput
                        value={form.thirdPartyRepName}
                        onChange={(e) => {
                          set('thirdPartyRepName', e.target.value);
                        }}
                        placeholder={t('placeholders.thirdPartyRepName')}
                      />
                    </Field>
                    <Field label={t('fields.thirdPartyRepAddress')}>
                      <TextInput
                        value={form.thirdPartyRepStreet}
                        onChange={(e) => {
                          set('thirdPartyRepStreet', e.target.value);
                        }}
                        placeholder={t('placeholders.street')}
                      />
                    </Field>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="min-w-0 sm:w-1/4">
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
                    <Field label={t('fields.thirdPartyRepCountry')}>
                      <TextInput
                        value={form.thirdPartyRepCountry}
                        onChange={(e) => {
                          set('thirdPartyRepCountry', e.target.value);
                        }}
                        placeholder={t('placeholders.country')}
                      />
                    </Field>
                    <Field label={t('fields.thirdPartyRepEmail')}>
                      <TextInput
                        type="email"
                        value={form.thirdPartyRepEmail}
                        onChange={(e) => {
                          set('thirdPartyRepEmail', e.target.value);
                        }}
                        placeholder={t('placeholders.thirdPartyRepEmail')}
                      />
                    </Field>
                  </div>
                </Reveal>
              </QField>
            ) : null}
          </CategoryRow>

          <CategoryRow label={t('categories.specialRisks')}>
            <QField label={t('fields.usesProfiling')}>
              <RadioGroup
                name="usesProfiling"
                options={yesNo}
                value={form.usesProfiling}
                onChange={(v) => {
                  set('usesProfiling', v);
                }}
              />
            </QField>
            <QField label={t('fields.processesSpecialData')}>
              <RadioGroup
                name="processesSpecialData"
                options={yesNo}
                value={form.processesSpecialData}
                onChange={(v) => {
                  set('processesSpecialData', v);
                }}
              />
              <Reveal show={form.processesSpecialData === 'yes'}>
                <div className="flex flex-col gap-2 pt-1">
                  {SPECIAL_DATA_OPTIONS.map((opt) => (
                    <CheckboxField
                      key={opt.value}
                      label={t(`options.specialDataCategories.${opt.value}`)}
                      checked={form.specialDataCategories.includes(opt.value)}
                      onChange={() => {
                        toggleSpecialData(opt.value);
                      }}
                    />
                  ))}
                </div>
              </Reveal>
            </QField>
          </CategoryRow>

          <CategoryRow label={t('categories.artificialIntelligence')}>
            <QField label={t('fields.usesAiProcessing')}>
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
            <QField label={t('fields.acceptsApplications')}>
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
              <QField label={t('fields.hasTalentPool')}>
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
            <QField label={t('fields.usesVideoSurveillance')}>
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
              <QField label={t('fields.videoRetention')}>
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
                <QField label={t('fields.videoRetentionDuration')}>
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
