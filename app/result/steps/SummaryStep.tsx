'use client';

import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  Globe,
  Buildings,
  EnvelopeSimple,
  MapPin,
  CurrencyDollar,
  Database,
  ArrowsLeftRight,
  UsersThree,
  Gavel,
} from '@/components/ui';
import { StepFooter } from '../ui/StepFooter';
import { StepHeader } from '../ui/StepHeader';
import { Container } from '@/components/shared/Container';
import { SCAN_GROUP_DEFINITIONS } from '../content/scan-groups';
import {
  type ImprovedFormData,
  EU_REP_PLANS,
  REVENUE_TYPE_OPTIONS,
  SPECIAL_DATA_OPTIONS,
  SUPERVISORY_AUTHORITY_OPTIONS,
} from '../content/improved-form';
import { isEuRepApplicable, isEuRepRequired, type EuRepState } from '../wizard-state';

interface SummaryStepProps {
  domain: string;
  formData: ImprovedFormData;
  euRep: EuRepState;
  onPreview: () => void;
  onBack?: () => void;
  isUpdateMode?: boolean;
  isSubmitting?: boolean;
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

function Row({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-4 sm:px-8 sm:py-5">{children}</div>;
}

function KV({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="text-muted text-xs">{label}</p>
      <div className="flex min-w-0 items-center gap-1.5">
        {icon && <span className="text-muted shrink-0">{icon}</span>}
        <p className="text-foreground min-w-0 text-base font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-3 py-1.5 text-sm font-medium"
      style={{ background: 'rgba(47,84,134,0.07)', color: 'var(--accent)' }}
    >
      {children}
    </span>
  );
}

function buildScanCoverage() {
  return SCAN_GROUP_DEFINITIONS.map((group) => ({
    label: group.label,
    items: group.items
      .filter((item) => item.status !== 'not-detected')
      .map((item) => (item.value ? `${item.name} (${item.value})` : item.name))
      .join(', '),
  }));
}

export function SummaryStep({
  domain,
  formData,
  euRep,
  onPreview,
  onBack,
  isUpdateMode = false,
  isSubmitting = false,
}: SummaryStepProps) {
  const t = useTranslations('result.summary');
  const tImproved = useTranslations('result.improvedStep.options');

  const scanCoverage = buildScanCoverage();
  const companyName = formData.companyName || domain;
  const euRepApplicable = isEuRepApplicable(formData);
  const euRepRequired = isEuRepRequired(formData);
  const gdprApplies = euRepRequired;

  function formatYesNo(value: string) {
    if (value === 'yes') return t('values.yes');
    if (value === 'no') return t('values.no');
    return '—';
  }

  function formatYesNoUnknown(value: string) {
    if (value === 'yes') return t('values.yes');
    if (value === 'no') return t('values.no');
    if (value === 'dontknow') return t('values.unknown');
    return '—';
  }

  function formatOptionLabel(value: string) {
    if (REVENUE_TYPE_OPTIONS.some((option) => option.value === value)) {
      return tImproved(`revenueTypes.${value}`);
    }
    if (SPECIAL_DATA_OPTIONS.some((option) => option.value === value)) {
      return tImproved(`specialDataCategories.${value}`);
    }
    if (SUPERVISORY_AUTHORITY_OPTIONS.some((option) => option.value === value)) {
      return tImproved(`supervisoryAuthority.${value}`);
    }
    return value;
  }

  function formatCountry() {
    if (formData.basedInSwitzerland === 'yes') return t('values.switzerland');
    return formData.country || '—';
  }

  function formatAddress() {
    const parts = [formData.street, formData.postalCode, formData.city, formatCountry()].filter(
      (part) => part && part !== '—'
    );
    return parts.length > 0 ? parts.join(', ') : '—';
  }

  function euRepSummary(): { label: string; detail?: string } {
    if (euRep.plan) {
      const plan = EU_REP_PLANS[euRep.plan];
      return {
        label: t('values.planLabel', { name: plan.name }),
        detail: t('values.planMonths', { inquiry: plan.inquiry, price: plan.price }),
      };
    }
    if (euRep.declined) {
      return {
        label: euRepRequired ? t('values.requiredNotAdded') : t('values.declined'),
        detail: t('values.noEuRepAdded'),
      };
    }
    return { label: t('values.pending') };
  }

  const authority =
    formData.listSupervisoryAuthority === 'yes'
      ? formatOptionLabel(formData.supervisoryAuthority)
      : t('values.notListed');
  const euRepInfo = euRepSummary();

  return (
    <>
      <StepHeader title={t('title')} description={t('description')} />

      <Container>
        <div className="border-border flex flex-col border-r border-l">
          <CategoryRow label={t('categories.overview')}>
            <Row>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <KV label={t('fields.policyType')} value={t('values.policyTypeEnhanced')} />
                <KV
                  label={t('fields.domain')}
                  value={formData.domain || domain}
                  icon={<Globe size={14} />}
                />
                <KV
                  label={t('fields.gdprApplicable')}
                  value={gdprApplies ? t('values.yes') : t('values.no')}
                />
                <KV label={t('fields.compliance')} value={t('values.complianceFramework')} />
                <KV
                  label={t('fields.euRepresentative')}
                  value={euRepApplicable ? euRepInfo.label : t('values.notRequired')}
                />
              </div>
            </Row>
          </CategoryRow>

          <CategoryRow label={t('categories.scanCoverage')}>
            {scanCoverage.map((item) => (
              <Row key={item.label}>
                <div className="flex items-start gap-3">
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0"
                    style={{ color: '#16a34a' }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground text-base font-medium">{item.label}</span>
                    <span className="text-muted text-sm">{item.items}</span>
                  </div>
                </div>
              </Row>
            ))}
          </CategoryRow>

          <CategoryRow label={t('categories.company')}>
            <Row>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <KV
                  label={t('fields.companyName')}
                  value={companyName}
                  icon={<Buildings size={14} />}
                />
                <KV
                  label={t('fields.contactEmail')}
                  value={formData.email || '—'}
                  icon={<EnvelopeSimple size={14} />}
                />
                <KV
                  label={t('fields.address')}
                  value={formatAddress()}
                  icon={<MapPin size={14} />}
                />
                <KV
                  label={t('fields.basedInSwitzerland')}
                  value={formatYesNo(formData.basedInSwitzerland)}
                />
              </div>
            </Row>
          </CategoryRow>

          <CategoryRow label={t('categories.business')}>
            <Row>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <KV
                    label={t('fields.generatesRevenue')}
                    value={formatYesNo(formData.generatesRevenue)}
                    icon={<CurrencyDollar size={14} />}
                  />
                  <KV
                    label={t('fields.usesDataForMarketing')}
                    value={formatYesNo(formData.usesDataForMarketing)}
                  />
                  <KV
                    label={t('fields.usesProfiling')}
                    value={formatYesNo(formData.usesProfiling)}
                  />
                  <KV
                    label={t('fields.employeePrivacyNotice')}
                    value={formatYesNo(formData.hasEmployeePrivacyNotice)}
                    icon={<UsersThree size={14} />}
                  />
                </div>
                {formData.generatesRevenue === 'yes' && formData.revenueTypes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-muted text-xs">{t('fields.revenueTypes')}</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.revenueTypes.map((type) => (
                        <Tag key={type}>{formatOptionLabel(type)}</Tag>
                      ))}
                    </div>
                  </div>
                ) : null}
                {formData.hasEmployeePrivacyNotice === 'yes' && formData.employeePrivacyUrl ? (
                  <KV label={t('fields.employeePrivacyUrl')} value={formData.employeePrivacyUrl} />
                ) : null}
              </div>
            </Row>
          </CategoryRow>

          <CategoryRow label={t('categories.dataProcessing')}>
            <Row>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <KV
                    label={t('fields.processesSpecialData')}
                    value={formatYesNo(formData.processesSpecialData)}
                    icon={<Database size={14} />}
                  />
                  <KV
                    label={t('fields.thirdCountryTransfers')}
                    value={formatYesNoUnknown(formData.transfersToThirdCountry)}
                    icon={<ArrowsLeftRight size={14} />}
                  />
                </div>
                {formData.processesSpecialData === 'yes' &&
                formData.specialDataCategories.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-muted text-xs">{t('fields.specialDataCategories')}</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.specialDataCategories.map((type) => (
                        <Tag key={type}>{formatOptionLabel(type)}</Tag>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Row>
          </CategoryRow>

          <CategoryRow label={t('categories.compliance')}>
            <Row>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <KV
                  label={t('fields.processesEuData')}
                  value={formatYesNoUnknown(formData.processesEUData)}
                />
                {formData.processesEUData === 'yes' ? (
                  <KV
                    label={t('fields.systematicProcessing')}
                    value={formatYesNoUnknown(formData.systematically)}
                  />
                ) : null}
                <KV
                  label={t('fields.targetsEuUsers')}
                  value={formatYesNoUnknown(formData.offersToEU)}
                />
                <KV
                  label={t('fields.monitorsEuBehaviour')}
                  value={formatYesNoUnknown(formData.monitorsEUBehaviour)}
                />
                <KV
                  label={t('fields.euEstablishment')}
                  value={formatYesNo(formData.hasEUEstablishment)}
                />
                <KV
                  label={t('fields.supervisoryAuthority')}
                  value={authority}
                  icon={<Gavel size={14} />}
                />
              </div>
            </Row>
          </CategoryRow>

          {euRepApplicable ? (
            <CategoryRow label={t('categories.euRep')}>
              <Row>
                <div className="flex flex-col gap-0.5">
                  <p className="text-foreground text-base font-medium">{euRepInfo.label}</p>
                  {euRepInfo.detail ? (
                    <p className="text-muted text-sm">{euRepInfo.detail}</p>
                  ) : null}
                </div>
              </Row>
            </CategoryRow>
          ) : null}
        </div>
      </Container>

      <StepFooter
        onBack={onBack}
        onContinue={onPreview}
        ctaLabel={isUpdateMode ? t('regeneratePolicy') : t('continueToCheckout')}
        ctaDisabled={isSubmitting}
      />
    </>
  );
}
