'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { improvedFormSchema, getVisibleEuRepQuestionFields } from '@/api/generator';
import { TextInput, RadioGroup, CheckboxField } from '../ui/FormSection';
import { UidCompanyLookup } from '../ui/UidCompanyLookup';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { Container } from '@/components/shared/Container';
import {
  type ImprovedFormData,
  REVENUE_TYPE_OPTIONS,
  SPECIAL_DATA_OPTIONS,
  SUPERVISORY_AUTHORITY_OPTIONS,
} from '../content/improved-form';
import { isWizardValidationSkipped } from '@/lib/wizard-debug';

export type { ImprovedFormData };

interface ImprovedStepProps {
  domain: string;
  onSubmit: (data: ImprovedFormData) => void;
  onBack?: () => void;
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
          style={{ overflow: 'hidden' }}
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

export function ImprovedStep({ domain, onSubmit, onBack, initialData }: ImprovedStepProps) {
  const t = useTranslations('result.improvedStep');
  const tEuRepQ = useTranslations('euRepQuestionnaire');
  const tValidation = useTranslations('validation');

  const companyGuess = domain.replace(/^www\./, '').split('.')[0] ?? domain;
  const companyName = companyGuess.charAt(0).toUpperCase() + companyGuess.slice(1);

  const [form, setForm] = useState<ImprovedFormData>(() => {
    const { domain: initialDomain, ...restInitial } = initialData ?? {};
    return {
      companyName,
      email: `info@${domain}`,
      street: '',
      postalCode: '',
      city: '',
      country: '',
      generatesRevenue: '',
      revenueTypes: [],
      processesSpecialData: '',
      specialDataCategories: [],
      basedInSwitzerland: '',
      processesEUData: '',
      systematically: '',
      offersToEU: '',
      monitorsEUBehaviour: '',
      hasEUEstablishment: '',
      transfersToThirdCountry: '',
      usesDataForMarketing: '',
      usesProfiling: '',
      hasEmployeePrivacyNotice: '',
      employeePrivacyUrl: '',
      listSupervisoryAuthority: '',
      supervisoryAuthority: '',
      ...restInitial,
      domain: initialDomain ?? domain,
    };
  });

  const euRepVisible = getVisibleEuRepQuestionFields(form);

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

      if (key === 'basedInSwitzerland') {
        next.offersToEU = '';
        next.monitorsEUBehaviour = '';
      }
      if (key === 'offersToEU') {
        next.monitorsEUBehaviour = '';
      }
      if (key === 'generatesRevenue' && value !== 'yes') {
        next.revenueTypes = [];
      }
      if (key === 'processesSpecialData' && value !== 'yes') {
        next.specialDataCategories = [];
      }
      if (key === 'processesEUData' && value !== 'yes') {
        next.systematically = '';
      }
      if (key === 'hasEmployeePrivacyNotice' && value !== 'yes') {
        next.employeePrivacyUrl = '';
      }
      if (key === 'listSupervisoryAuthority' && value !== 'yes') {
        next.supervisoryAuthority = '';
      }

      return next;
    });
  }

  function toggle(key: 'revenueTypes' | 'specialDataCategories', value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
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
    <>
      <StepHeader title={t('title')} />
      <Container>
        <div className="border-border flex flex-col border-r border-l">
          <CategoryRow label={t('categories.controllerIdentity')}>
            <QField label={t('uidLookup.label')} hint={t('uidLookup.fieldHint')}>
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
            <QField label={t('fields.domain')}>
              <TextInput
                value={form.domain}
                onChange={(e) => {
                  set('domain', e.target.value);
                }}
                placeholder={t('placeholders.domain')}
              />
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
            <QField label={t('fields.postalAddress')}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <TextInput
                  value={form.street}
                  onChange={(e) => {
                    set('street', e.target.value);
                  }}
                  placeholder={t('placeholders.street')}
                  className="sm:flex-[2]"
                />
                <TextInput
                  value={form.postalCode}
                  onChange={(e) => {
                    set('postalCode', e.target.value);
                  }}
                  placeholder={t('placeholders.postalCode')}
                  className="sm:flex-1"
                />
                <TextInput
                  value={form.city}
                  onChange={(e) => {
                    set('city', e.target.value);
                  }}
                  placeholder={t('placeholders.city')}
                  className="sm:flex-1"
                />
              </div>
              <TextInput
                value={form.country}
                onChange={(e) => {
                  set('country', e.target.value);
                }}
                placeholder={t('placeholders.country')}
              />
            </QField>
          </CategoryRow>

          <CategoryRow label={t('categories.businessModel')}>
            <QField label={t('fields.generatesRevenue')}>
              <RadioGroup
                name="generatesRevenue"
                options={yesNo}
                value={form.generatesRevenue}
                onChange={(v) => {
                  set('generatesRevenue', v);
                }}
              />
            </QField>
            <Reveal show={form.generatesRevenue === 'yes'}>
              <QField label={t('fields.revenueTypes')}>
                <div className="flex flex-col gap-2">
                  {REVENUE_TYPE_OPTIONS.map((opt) => (
                    <CheckboxField
                      key={opt.value}
                      label={t(`options.revenueTypes.${opt.value}`)}
                      checked={form.revenueTypes.includes(opt.value)}
                      onChange={() => {
                        toggle('revenueTypes', opt.value);
                      }}
                    />
                  ))}
                </div>
              </QField>
            </Reveal>
            <QField label={t('fields.processesSpecialData')}>
              <RadioGroup
                name="processesSpecialData"
                options={yesNo}
                value={form.processesSpecialData}
                onChange={(v) => {
                  set('processesSpecialData', v);
                }}
              />
            </QField>
            <Reveal show={form.processesSpecialData === 'yes'}>
              <QField label={t('fields.specialDataCategories')}>
                <div className="flex flex-col gap-2">
                  {SPECIAL_DATA_OPTIONS.map((opt) => (
                    <CheckboxField
                      key={opt.value}
                      label={t(`options.specialDataCategories.${opt.value}`)}
                      checked={form.specialDataCategories.includes(opt.value)}
                      onChange={() => {
                        toggle('specialDataCategories', opt.value);
                      }}
                    />
                  ))}
                </div>
              </QField>
            </Reveal>
          </CategoryRow>

          <CategoryRow label={t('categories.jurisdiction')}>
            <QField
              label={tEuRepQ('questions.q1.title')}
              hint={tEuRepQ('questions.q1.description')}
            >
              <RadioGroup
                name="basedInSwitzerland"
                options={yesNo}
                value={form.basedInSwitzerland}
                onChange={(v) => {
                  set('basedInSwitzerland', v);
                }}
              />
            </QField>
            {euRepVisible.offersToEU ? (
              <QField
                label={tEuRepQ('questions.q2.title')}
                hint={tEuRepQ('questions.q2.description')}
              >
                <RadioGroup
                  name="offersToEU"
                  options={yesNoDontKnow}
                  value={form.offersToEU}
                  onChange={(v) => {
                    set('offersToEU', v);
                  }}
                />
              </QField>
            ) : null}
            {euRepVisible.monitorsEUBehaviour ? (
              <QField
                label={tEuRepQ('questions.q3.title')}
                hint={tEuRepQ('questions.q3.description')}
              >
                <RadioGroup
                  name="monitorsEUBehaviour"
                  options={yesNoDontKnow}
                  value={form.monitorsEUBehaviour}
                  onChange={(v) => {
                    set('monitorsEUBehaviour', v);
                  }}
                />
              </QField>
            ) : null}
            <QField label={t('fields.processesEUData')}>
              <RadioGroup
                name="processesEUData"
                options={yesNoDontKnow}
                value={form.processesEUData}
                onChange={(v) => {
                  set('processesEUData', v);
                }}
              />
            </QField>
            <Reveal show={form.processesEUData === 'yes'}>
              <QField label={t('fields.systematically')}>
                <RadioGroup
                  name="systematically"
                  options={yesNoDontKnow}
                  value={form.systematically}
                  onChange={(v) => {
                    set('systematically', v);
                  }}
                />
              </QField>
            </Reveal>
            <QField label={t('fields.hasEUEstablishment')}>
              <RadioGroup
                name="hasEUEstablishment"
                options={yesNo}
                value={form.hasEUEstablishment}
                onChange={(v) => {
                  set('hasEUEstablishment', v);
                }}
              />
            </QField>
            <QField label={t('fields.transfersToThirdCountry')}>
              <RadioGroup
                name="transfersToThirdCountry"
                options={yesNoDontKnow}
                value={form.transfersToThirdCountry}
                onChange={(v) => {
                  set('transfersToThirdCountry', v);
                }}
              />
            </QField>
          </CategoryRow>

          <CategoryRow label={t('categories.dataUsage')}>
            <QField label={t('fields.usesDataForMarketing')}>
              <RadioGroup
                name="usesDataForMarketing"
                options={yesNo}
                value={form.usesDataForMarketing}
                onChange={(v) => {
                  set('usesDataForMarketing', v);
                }}
              />
            </QField>
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
            <QField label={t('fields.hasEmployeePrivacyNotice')}>
              <RadioGroup
                name="hasEmployeePrivacyNotice"
                options={yesNo}
                value={form.hasEmployeePrivacyNotice}
                onChange={(v) => {
                  set('hasEmployeePrivacyNotice', v);
                }}
              />
            </QField>
            <Reveal show={form.hasEmployeePrivacyNotice === 'yes'}>
              <QField label={t('fields.employeePrivacyUrl')}>
                <TextInput
                  value={form.employeePrivacyUrl}
                  onChange={(e) => {
                    set('employeePrivacyUrl', e.target.value);
                  }}
                  placeholder={t('placeholders.employeePrivacyUrl')}
                />
              </QField>
            </Reveal>
            <QField label={t('fields.listSupervisoryAuthority')}>
              <RadioGroup
                name="listSupervisoryAuthority"
                options={yesNo}
                value={form.listSupervisoryAuthority}
                onChange={(v) => {
                  set('listSupervisoryAuthority', v);
                }}
              />
            </QField>
            <Reveal show={form.listSupervisoryAuthority === 'yes'}>
              <QField label={t('fields.supervisoryAuthority')}>
                <RadioGroup
                  name="supervisoryAuthority"
                  options={SUPERVISORY_AUTHORITY_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: t(`options.supervisoryAuthority.${opt.value}`),
                  }))}
                  value={form.supervisoryAuthority}
                  onChange={(v) => {
                    set('supervisoryAuthority', v);
                  }}
                />
              </QField>
            </Reveal>
          </CategoryRow>
        </div>
      </Container>

      <StepFooter onBack={onBack} onContinue={handleSubmit} ctaLabel={t('continue')} />
    </>
  );
}
