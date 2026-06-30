'use client';

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
  Star,
  Briefcase,
  Crown,
} from '@/components/ui';
import { StepFooter } from '../ui/StepFooter';
import { StepHeader } from '../ui/StepHeader';
import { Container } from '@/components/shared/Container';
import type { ImprovedFormData } from './ImprovedStep';

const AUTO_COVERED = [
  { label: 'Communication and CRM', items: 'Intercom, HubSpot, Mailchimp' },
  { label: 'Embedded content', items: 'Google Maps, YouTube, Google Fonts, Meta Pixel' },
  { label: 'Infrastructure', items: 'Cloudflare (EU-based), Stripe' },
  { label: 'E-Commerce and Forms', items: 'Contact form, Newsletter, User accounts' },
  { label: 'Security and Technical', items: 'Cloudflare CDN, Cookiebot, reCAPTCHA' },
  { label: 'Analytics and Advertising', items: 'Google Analytics 4, 12 trackers, Google Ads' },
  { label: 'User Accounts', items: 'Login system, Google Sign-In (SSO)' },
];

const EU_REP_PLANS = {
  budget: {
    name: 'Budget',
    icon: <Briefcase size={20} weight="fill" />,
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    price: 'CHF 149.00',
    inquiry: 'CHF 99.00 per inquiry',
  },
  standard: {
    name: 'Standard',
    icon: <Star size={20} weight="fill" />,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    price: 'CHF 249.00',
    inquiry: '1 inquiry / year included',
  },
  premium: {
    name: 'Premium',
    icon: <Crown size={20} weight="fill" />,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.08)',
    price: 'CHF 499.00',
    inquiry: '5 inquiries / year included',
  },
} as const;

interface SummaryStepProps {
  domain: string;
  formData?: ImprovedFormData;
  path: 'basic' | 'improved';
  includeEuRep?: boolean;
  euRepPlan?: 'budget' | 'standard' | 'premium';
  onPreview: () => void;
  onBack?: () => void;
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

function Row({ children }: { children: React.ReactNode }) {
  return <div className="px-8 py-5">{children}</div>;
}

function KV({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-muted text-xs">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted">{icon}</span>}
        <p className="text-foreground text-base font-medium">{value}</p>
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

export function SummaryStep({
  domain,
  formData,
  path,
  includeEuRep,
  euRepPlan,
  onPreview,
  onBack,
}: SummaryStepProps) {
  const companyName = formData?.companyName || domain;
  const gdprApplies = formData
    ? formData.offersToEU === 'yes' || formData.processesEUData === 'yes'
    : true;
  const country = formData
    ? formData.basedInSwitzerland === 'yes'
      ? 'Switzerland'
      : formData.country || 'Other'
    : 'Switzerland';
  const authority =
    formData?.listSupervisoryAuthority === 'yes'
      ? ({
          edob: 'EDÖB (Switzerland)',
          bfdi: 'BfDI (Germany)',
          dsb: 'DSB (Austria)',
          other: 'Other',
        }[formData.supervisoryAuthority] ?? '—')
      : 'Not listed';

  const revenueTypeLabels: Record<string, string> = {
    products: 'Products',
    services: 'Services',
    subscriptions: 'Subscriptions',
    advertising: 'Advertising',
    consulting: 'Consulting',
    other: 'Other',
  };
  const specialDataLabels: Record<string, string> = {
    health: 'Health',
    political: 'Political opinions',
    religion: 'Religion',
    biometric: 'Biometric',
    ethnic: 'Ethnic origin',
    sexual: 'Sexual orientation',
  };

  const selectedPlan = euRepPlan ? EU_REP_PLANS[euRepPlan] : null;

  return (
    <>
      <StepHeader
        title="Your privacy policy is ready."
        description={
          path === 'improved'
            ? 'Generated based on your website scan and the details you provided.'
            : 'Generated automatically based on your website scan.'
        }
      />

      <Container>
        <div className="border-border flex flex-col border-r border-l">
          {/* Overview */}
          <CategoryRow label="Overview">
            <Row>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <KV label="Policy type" value={path === 'improved' ? 'Enhanced' : 'Basic'} />
                <KV label="Domain" value={formData?.domain ?? domain} icon={<Globe size={14} />} />
                <KV label="GDPR applicable" value={gdprApplies ? 'Yes' : 'No'} />
                <KV label="Compliance" value="GDPR / Swiss nFADP" />
              </div>
            </Row>
          </CategoryRow>

          {/* Scan coverage */}
          <CategoryRow label="Scan coverage">
            {AUTO_COVERED.map((item) => (
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

          {/* Questionnaire (enhanced path only) */}
          {path === 'improved' && formData && (
            <>
              <CategoryRow label="Company">
                <Row>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <KV label="Company name" value={companyName} icon={<Buildings size={14} />} />
                    {formData.email && (
                      <KV
                        label="Contact email"
                        value={formData.email}
                        icon={<EnvelopeSimple size={14} />}
                      />
                    )}
                    {formData.street && (
                      <KV
                        label="Address"
                        value={[formData.street, formData.postalCode, formData.city, country]
                          .filter(Boolean)
                          .join(', ')}
                        icon={<MapPin size={14} />}
                      />
                    )}
                    <KV
                      label="Based in Switzerland"
                      value={formData.basedInSwitzerland === 'yes' ? 'Yes' : 'No'}
                    />
                  </div>
                </Row>
              </CategoryRow>

              <CategoryRow label="Business">
                <Row>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <KV
                        label="Generates revenue"
                        value={
                          formData.generatesRevenue === 'yes'
                            ? 'Yes'
                            : formData.generatesRevenue === 'no'
                              ? 'No'
                              : 'Unknown'
                        }
                        icon={<CurrencyDollar size={14} />}
                      />
                      <KV
                        label="Uses data for marketing"
                        value={
                          formData.usesDataForMarketing === 'yes'
                            ? 'Yes'
                            : formData.usesDataForMarketing === 'no'
                              ? 'No'
                              : 'Unknown'
                        }
                      />
                      <KV
                        label="Uses profiling"
                        value={
                          formData.usesProfiling === 'yes'
                            ? 'Yes'
                            : formData.usesProfiling === 'no'
                              ? 'No'
                              : 'Unknown'
                        }
                        icon={<ChartBar size={14} />}
                      />
                      <KV
                        label="Employee privacy notice"
                        value={
                          formData.hasEmployeePrivacyNotice === 'yes'
                            ? 'Yes'
                            : formData.hasEmployeePrivacyNotice === 'no'
                              ? 'No'
                              : 'Unknown'
                        }
                        icon={<UsersThree size={14} />}
                      />
                    </div>
                    {formData.generatesRevenue === 'yes' && formData.revenueTypes.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-muted text-xs">Revenue types</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.revenueTypes.map((t) => (
                            <Tag key={t}>{revenueTypeLabels[t] ?? t}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Row>
              </CategoryRow>

              <CategoryRow label="Data processing">
                <Row>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <KV
                        label="Processes special data"
                        value={
                          formData.processesSpecialData === 'yes'
                            ? 'Yes'
                            : formData.processesSpecialData === 'no'
                              ? 'No'
                              : 'Unknown'
                        }
                        icon={<Database size={14} />}
                      />
                      <KV
                        label="Third-country transfers"
                        value={
                          formData.transfersToThirdCountry === 'yes'
                            ? 'Yes'
                            : formData.transfersToThirdCountry === 'no'
                              ? 'No'
                              : 'Unknown'
                        }
                        icon={<ArrowsLeftRight size={14} />}
                      />
                    </div>
                    {formData.processesSpecialData === 'yes' &&
                      formData.specialDataCategories.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-muted text-xs">Special data categories</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.specialDataCategories.map((t) => (
                              <Tag key={t}>{specialDataLabels[t] ?? t}</Tag>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </Row>
              </CategoryRow>

              <CategoryRow label="Compliance">
                <Row>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <KV
                      label="Targets EU/EEA users"
                      value={
                        formData.offersToEU === 'yes'
                          ? 'Yes'
                          : formData.offersToEU === 'no'
                            ? 'No'
                            : 'Unknown'
                      }
                    />
                    <KV
                      label="Monitors EU behaviour"
                      value={
                        formData.monitorsEUBehaviour === 'yes'
                          ? 'Yes'
                          : formData.monitorsEUBehaviour === 'no'
                            ? 'No'
                            : 'Unknown'
                      }
                    />
                    <KV
                      label="EU establishment"
                      value={
                        formData.hasEUEstablishment === 'yes'
                          ? 'Yes'
                          : formData.hasEUEstablishment === 'no'
                            ? 'No'
                            : 'Unknown'
                      }
                    />
                    <KV
                      label="Supervisory authority"
                      value={authority}
                      icon={<Gavel size={14} />}
                    />
                  </div>
                </Row>
              </CategoryRow>
            </>
          )}

          {/* EU Representative */}
          {includeEuRep && selectedPlan && (
            <CategoryRow label="EU Representative">
              <Row>
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: selectedPlan.bg, color: selectedPlan.color }}
                  >
                    {selectedPlan.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-foreground text-base font-medium">
                      {selectedPlan.name} plan
                    </p>
                    <p className="text-muted text-sm">
                      {selectedPlan.inquiry} · {selectedPlan.price} / 12 months
                    </p>
                  </div>
                </div>
              </Row>
            </CategoryRow>
          )}
        </div>
      </Container>

      <StepFooter onBack={onBack} onContinue={onPreview} ctaLabel="Preview privacy policy" />
    </>
  );
}
