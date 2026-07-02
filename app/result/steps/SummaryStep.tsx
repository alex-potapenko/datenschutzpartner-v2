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
  ChartBar,
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
  formatYesNo,
  formatYesNoUnknown,
  formatOptionLabel,
} from '../content/improved-form';

interface SummaryStepProps {
  domain: string;
  formData: ImprovedFormData;
  includeEuRep?: boolean;
  euRepPlan?: 'budget' | 'standard' | 'premium';
  euRepSkipped?: boolean;
  onPreview: () => void;
  onBack?: () => void;
}

function CategoryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-border grid grid-cols-1 border-b last:border-b-0 lg:grid-cols-2">
      <div className="border-border border-b p-4 sm:p-8 lg:border-r lg:border-b-0">
        <h2 className="text-lg leading-snug font-semibold" style={{ color: '#525252' }}>
          {label}
        </h2>
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

function formatCountry(formData: ImprovedFormData) {
  if (formData.basedInSwitzerland === 'yes') return 'Switzerland';
  return formData.country || '—';
}

function formatAddress(formData: ImprovedFormData) {
  const parts = [
    formData.street,
    formData.postalCode,
    formData.city,
    formatCountry(formData),
  ].filter((part) => part && part !== '—');
  return parts.length > 0 ? parts.join(', ') : '—';
}

export function SummaryStep({
  domain,
  formData,
  includeEuRep,
  euRepPlan,
  euRepSkipped,
  onPreview,
  onBack,
}: SummaryStepProps) {
  const tSummary = useTranslations('result.summary');
  const scanCoverage = buildScanCoverage();
  const companyName = formData.companyName || domain;
  const gdprApplies =
    formData.offersToEU === 'yes' ||
    formData.processesEUData === 'yes' ||
    formData.monitorsEUBehaviour === 'yes';
  const authority =
    formData.listSupervisoryAuthority === 'yes'
      ? formatOptionLabel(formData.supervisoryAuthority)
      : 'Not listed';
  const selectedPlan = euRepPlan ? EU_REP_PLANS[euRepPlan] : null;

  return (
    <>
      <StepHeader
        title="Your privacy policy is ready."
        description="Generated based on your website scan and the details you provided."
      />

      <Container>
        <div className="border-border flex flex-col border-r border-l">
          <CategoryRow label="Overview">
            <Row>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <KV label="Policy type" value="Enhanced" />
                <KV label="Domain" value={formData.domain || domain} icon={<Globe size={14} />} />
                <KV label="GDPR applicable" value={gdprApplies ? 'Yes' : 'No'} />
                <KV label="Compliance" value="GDPR / Swiss nFADP" />
                {includeEuRep ? (
                  <KV
                    label="EU Representative"
                    value={
                      selectedPlan
                        ? `${selectedPlan.name} plan`
                        : euRepSkipped
                          ? 'Declined'
                          : 'Pending'
                    }
                  />
                ) : null}
              </div>
            </Row>
          </CategoryRow>

          <CategoryRow label="Scan coverage">
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

          <CategoryRow label="Company">
            <Row>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <KV label="Company name" value={companyName} icon={<Buildings size={14} />} />
                <KV
                  label="Contact email"
                  value={formData.email || '—'}
                  icon={<EnvelopeSimple size={14} />}
                />
                <KV label="Address" value={formatAddress(formData)} icon={<MapPin size={14} />} />
                <KV label="Based in Switzerland" value={formatYesNo(formData.basedInSwitzerland)} />
              </div>
            </Row>
          </CategoryRow>

          <CategoryRow label="Business">
            <Row>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <KV
                    label="Generates revenue"
                    value={formatYesNo(formData.generatesRevenue)}
                    icon={<CurrencyDollar size={14} />}
                  />
                  <KV
                    label="Uses data for marketing"
                    value={formatYesNo(formData.usesDataForMarketing)}
                  />
                  <KV
                    label="Uses profiling"
                    value={formatYesNo(formData.usesProfiling)}
                    icon={<ChartBar size={14} />}
                  />
                  <KV
                    label="Employee privacy notice"
                    value={formatYesNo(formData.hasEmployeePrivacyNotice)}
                    icon={<UsersThree size={14} />}
                  />
                </div>
                {formData.generatesRevenue === 'yes' && formData.revenueTypes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-muted text-xs">Revenue types</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.revenueTypes.map((type) => (
                        <Tag key={type}>{formatOptionLabel(type)}</Tag>
                      ))}
                    </div>
                  </div>
                ) : null}
                {formData.hasEmployeePrivacyNotice === 'yes' && formData.employeePrivacyUrl ? (
                  <KV label="Employee privacy notice URL" value={formData.employeePrivacyUrl} />
                ) : null}
              </div>
            </Row>
          </CategoryRow>

          <CategoryRow label="Data processing">
            <Row>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <KV
                    label="Processes special data"
                    value={formatYesNo(formData.processesSpecialData)}
                    icon={<Database size={14} />}
                  />
                  <KV
                    label="Third-country transfers"
                    value={formatYesNoUnknown(formData.transfersToThirdCountry)}
                    icon={<ArrowsLeftRight size={14} />}
                  />
                </div>
                {formData.processesSpecialData === 'yes' &&
                formData.specialDataCategories.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-muted text-xs">Special data categories</p>
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

          <CategoryRow label="Compliance">
            <Row>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <KV
                  label="Processes EU/EEA data"
                  value={formatYesNoUnknown(formData.processesEUData)}
                />
                {formData.processesEUData === 'yes' ? (
                  <KV
                    label="Systematic processing"
                    value={formatYesNoUnknown(formData.systematically)}
                  />
                ) : null}
                <KV label="Targets EU/EEA users" value={formatYesNoUnknown(formData.offersToEU)} />
                <KV
                  label="Monitors EU behaviour"
                  value={formatYesNoUnknown(formData.monitorsEUBehaviour)}
                />
                <KV label="EU establishment" value={formatYesNo(formData.hasEUEstablishment)} />
                <KV
                  label="Existing EU representative"
                  value={formatYesNo(formData.hasEURepresentative)}
                />
                {formData.hasEURepresentative === 'yes' ? (
                  <KV
                    label="EU representative address"
                    value={formData.euRepresentativeAddress || '—'}
                  />
                ) : null}
                <KV label="Supervisory authority" value={authority} icon={<Gavel size={14} />} />
              </div>
            </Row>
          </CategoryRow>

          {includeEuRep && (selectedPlan || euRepSkipped) ? (
            <CategoryRow label="EU Representative">
              <Row>
                {selectedPlan ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-foreground text-base font-medium">
                      {selectedPlan.name} plan
                    </p>
                    <p className="text-muted text-sm">
                      {selectedPlan.inquiry} · {selectedPlan.price} / 12 months
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-foreground text-base font-medium">
                      {tSummary('euRepSkippedTitle')}
                    </p>
                    <p className="text-muted text-sm">{tSummary('euRepSkippedDetail')}</p>
                  </div>
                )}
              </Row>
            </CategoryRow>
          ) : null}
        </div>
      </Container>

      <StepFooter onBack={onBack} onContinue={onPreview} ctaLabel="Preview privacy policy" />
    </>
  );
}
