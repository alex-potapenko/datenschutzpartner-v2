'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TextInput, RadioGroup, CheckboxField } from '../ui/FormSection';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { Container } from '@/components/shared/Container';

export interface ImprovedFormData {
  companyName: string;
  domain: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  generatesRevenue: string;
  revenueTypes: string[];
  processesSpecialData: string;
  specialDataCategories: string[];
  basedInSwitzerland: string;
  processesEUData: string;
  systematically: string;
  offersToEU: string;
  monitorsEUBehaviour: string;
  hasEUEstablishment: string;
  hasEURepresentative: string;
  euRepresentativeAddress: string;
  transfersToThirdCountry: string;
  usesDataForMarketing: string;
  usesProfiling: string;
  hasEmployeePrivacyNotice: string;
  employeePrivacyUrl: string;
  listSupervisoryAuthority: string;
  supervisoryAuthority: string;
}

interface ImprovedStepProps {
  domain: string;
  onSubmit: (data: ImprovedFormData) => void;
  onBack?: () => void;
}

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const YES_NO_DONTKNOW = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'dontknow', label: 'Unknown' },
];

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
    <div
      className="border-border grid border-b last:border-b-0"
      style={{ gridTemplateColumns: '1fr 1fr' }}
    >
      <div className="border-border border-r p-8">
        <h2 className="text-xl leading-snug font-semibold" style={{ color: '#525252' }}>
          {label}
        </h2>
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
    <div className="flex flex-col gap-3 px-6 py-6">
      <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
        {label}
      </p>
      {hint && <p className="text-muted text-xs">{hint}</p>}
      {children}
    </div>
  );
}

export function ImprovedStep({ domain, onSubmit, onBack }: ImprovedStepProps) {
  const companyGuess = domain.replace(/^www\./, '').split('.')[0] ?? domain;
  const companyName = companyGuess.charAt(0).toUpperCase() + companyGuess.slice(1);

  const [form, setForm] = useState<ImprovedFormData>({
    companyName,
    domain,
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
    hasEURepresentative: '',
    euRepresentativeAddress: '',
    transfersToThirdCountry: '',
    usesDataForMarketing: '',
    usesProfiling: '',
    hasEmployeePrivacyNotice: '',
    employeePrivacyUrl: '',
    listSupervisoryAuthority: '',
    supervisoryAuthority: '',
  });

  function set<K extends keyof ImprovedFormData>(key: K, value: ImprovedFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(key: 'revenueTypes' | 'specialDataCategories', value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }

  return (
    <>
      <StepHeader
        title="Complete your privacy policy."
        description="We pre-filled everything we could from your scan. Just confirm a few details — the rest is covered automatically."
      />
      <Container>
        <div className="border-border flex flex-col border-r border-l">
          {/* Controller Identity */}
          <CategoryRow label="Controller Identity">
            <QField label="Who is responsible for processing personal data?">
              <TextInput
                value={form.companyName}
                onChange={(e) => {
                  set('companyName', e.target.value);
                }}
                placeholder="Company or person name"
              />
            </QField>
            <QField label="Under which domain is the website accessible?">
              <TextInput
                value={form.domain}
                onChange={(e) => {
                  set('domain', e.target.value);
                }}
                placeholder="mywebsite.ch"
              />
            </QField>
            <QField label="Email address">
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => {
                  set('email', e.target.value);
                }}
                placeholder="info@mywebsite.ch"
              />
            </QField>
            <QField label="Postal address">
              <div className="flex gap-3">
                <TextInput
                  value={form.street}
                  onChange={(e) => {
                    set('street', e.target.value);
                  }}
                  placeholder="Street and number"
                  className="flex-[2]"
                />
                <TextInput
                  value={form.postalCode}
                  onChange={(e) => {
                    set('postalCode', e.target.value);
                  }}
                  placeholder="Postal code"
                  className="flex-1"
                />
                <TextInput
                  value={form.city}
                  onChange={(e) => {
                    set('city', e.target.value);
                  }}
                  placeholder="City"
                  className="flex-1"
                />
              </div>
              <TextInput
                value={form.country}
                onChange={(e) => {
                  set('country', e.target.value);
                }}
                placeholder="Country"
              />
            </QField>
          </CategoryRow>

          {/* Business Model and Special Data */}
          <CategoryRow label="Business Model and Special Data">
            <QField label="Is the website used to generate direct revenue?">
              <RadioGroup
                name="generatesRevenue"
                options={YES_NO}
                value={form.generatesRevenue}
                onChange={(v) => {
                  set('generatesRevenue', v);
                }}
              />
            </QField>
            <Reveal show={form.generatesRevenue === 'yes'}>
              <QField label="How does the website generate direct revenue?">
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'memberships', label: 'Memberships / subscriptions' },
                    { value: 'products', label: 'Sale of products / services' },
                    { value: 'advertising', label: 'Advertising' },
                    { value: 'other', label: 'Other' },
                  ].map((opt) => (
                    <CheckboxField
                      key={opt.value}
                      label={opt.label}
                      checked={form.revenueTypes.includes(opt.value)}
                      onChange={() => {
                        toggle('revenueTypes', opt.value);
                      }}
                    />
                  ))}
                </div>
              </QField>
            </Reveal>
            <QField label="Are special categories of personal data processed?">
              <RadioGroup
                name="processesSpecialData"
                options={YES_NO}
                value={form.processesSpecialData}
                onChange={(v) => {
                  set('processesSpecialData', v);
                }}
              />
            </QField>
            <Reveal show={form.processesSpecialData === 'yes'}>
              <QField label="Which special categories?">
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'health', label: 'Health data' },
                    { value: 'religion', label: 'Religious / philosophical beliefs' },
                    { value: 'politics', label: 'Political opinions' },
                    { value: 'union', label: 'Trade union membership' },
                    { value: 'genetic', label: 'Genetic data' },
                    { value: 'biometric', label: 'Biometric data' },
                    { value: 'sexuality', label: 'Data about sex life / sexual orientation' },
                  ].map((opt) => (
                    <CheckboxField
                      key={opt.value}
                      label={opt.label}
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

          {/* Jurisdiction and GDPR */}
          <CategoryRow label="Jurisdiction and GDPR">
            <QField
              label="Is the operator a company based in Switzerland?"
              hint="Determines DSG vs. GDPR path"
            >
              <RadioGroup
                name="basedInSwitzerland"
                options={YES_NO}
                value={form.basedInSwitzerland}
                onChange={(v) => {
                  set('basedInSwitzerland', v);
                }}
              />
            </QField>
            <QField label="Does the company process personal data from the EU/EEA?">
              <RadioGroup
                name="processesEUData"
                options={YES_NO_DONTKNOW}
                value={form.processesEUData}
                onChange={(v) => {
                  set('processesEUData', v);
                }}
              />
            </QField>
            <Reveal show={form.processesEUData === 'yes'}>
              <QField label="Does this happen systematically?">
                <RadioGroup
                  name="systematically"
                  options={YES_NO_DONTKNOW}
                  value={form.systematically}
                  onChange={(v) => {
                    set('systematically', v);
                  }}
                />
              </QField>
            </Reveal>
            <QField label="Does the company offer goods/services to people in the EU/EEA?">
              <RadioGroup
                name="offersToEU"
                options={YES_NO_DONTKNOW}
                value={form.offersToEU}
                onChange={(v) => {
                  set('offersToEU', v);
                }}
              />
            </QField>
            <QField label="Does the company monitor the behaviour of people in the EU/EEA?">
              <RadioGroup
                name="monitorsEUBehaviour"
                options={YES_NO_DONTKNOW}
                value={form.monitorsEUBehaviour}
                onChange={(v) => {
                  set('monitorsEUBehaviour', v);
                }}
              />
            </QField>
            <QField label="Does the company have an establishment in the EU/EEA?">
              <RadioGroup
                name="hasEUEstablishment"
                options={YES_NO}
                value={form.hasEUEstablishment}
                onChange={(v) => {
                  set('hasEUEstablishment', v);
                }}
              />
            </QField>
            <QField label="Does the company have an EU data protection representative?">
              <RadioGroup
                name="hasEURepresentative"
                options={YES_NO}
                value={form.hasEURepresentative}
                onChange={(v) => {
                  set('hasEURepresentative', v);
                }}
              />
            </QField>
            <Reveal show={form.hasEURepresentative === 'yes'}>
              <QField label="Address of the EU representative">
                <TextInput
                  value={form.euRepresentativeAddress}
                  onChange={(e) => {
                    set('euRepresentativeAddress', e.target.value);
                  }}
                  placeholder="Name, street, city, country"
                />
              </QField>
            </Reveal>
            <QField label="Is personal data transferred to a third country outside the EU/EEA?">
              <RadioGroup
                name="transfersToThirdCountry"
                options={YES_NO_DONTKNOW}
                value={form.transfersToThirdCountry}
                onChange={(v) => {
                  set('transfersToThirdCountry', v);
                }}
              />
            </QField>
          </CategoryRow>

          {/* Data Usage and Compliance */}
          <CategoryRow label="Data Usage and Compliance">
            <QField label="Is personal data used for direct marketing?">
              <RadioGroup
                name="usesDataForMarketing"
                options={YES_NO}
                value={form.usesDataForMarketing}
                onChange={(v) => {
                  set('usesDataForMarketing', v);
                }}
              />
            </QField>
            <QField label="Is profiling or automated decision-making carried out?">
              <RadioGroup
                name="usesProfiling"
                options={YES_NO}
                value={form.usesProfiling}
                onChange={(v) => {
                  set('usesProfiling', v);
                }}
              />
            </QField>
            <QField label="Is there a separate privacy notice for employees?">
              <RadioGroup
                name="hasEmployeePrivacyNotice"
                options={YES_NO}
                value={form.hasEmployeePrivacyNotice}
                onChange={(v) => {
                  set('hasEmployeePrivacyNotice', v);
                }}
              />
            </QField>
            <Reveal show={form.hasEmployeePrivacyNotice === 'yes'}>
              <QField label="URL of employee privacy notice">
                <TextInput
                  value={form.employeePrivacyUrl}
                  onChange={(e) => {
                    set('employeePrivacyUrl', e.target.value);
                  }}
                  placeholder="https://yourcompany.com/employee-privacy"
                />
              </QField>
            </Reveal>
            <QField label="Should supervisory authority contact details be listed?">
              <RadioGroup
                name="listSupervisoryAuthority"
                options={YES_NO}
                value={form.listSupervisoryAuthority}
                onChange={(v) => {
                  set('listSupervisoryAuthority', v);
                }}
              />
            </QField>
            <Reveal show={form.listSupervisoryAuthority === 'yes'}>
              <QField label="Which supervisory authority?">
                <RadioGroup
                  name="supervisoryAuthority"
                  options={[
                    { value: 'edob', label: 'EDÖB (Switzerland)' },
                    { value: 'bfdi', label: 'BfDI (Germany)' },
                    { value: 'dsb', label: 'DSB (Austria)' },
                    { value: 'other', label: 'Other' },
                  ]}
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

      <StepFooter
        onBack={onBack}
        onContinue={() => {
          onSubmit(form);
        }}
        ctaLabel="Review summary"
      />
    </>
  );
}
