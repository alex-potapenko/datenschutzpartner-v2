'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Button,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  useOverlayState,
  Switch,
  SwitchControl,
  SwitchThumb,
  SwitchContent,
} from '@/components/ui';
import { StepFooter } from '../ui/StepFooter';
import {
  CheckCircle,
  Warning,
  XCircle,
  ChatCircle,
  UsersThree,
  MapPin,
  YoutubeLogo,
  TextT,
  InstagramLogo,
  Cloud,
  CreditCard,
  EnvelopeSimple,
  Bell,
  ShieldCheck,
  Cookie,
  Robot,
  ChartBar,
  MegaphoneSimple,
  UserCircle,
  Crosshair,
  Storefront,
  Wrench,
  Eye,
  FileText,
} from '@/components/ui';
import { Container } from '@/components/shared/Container';

type ItemStatus = 'detected' | 'not-detected' | 'warning';
type ItemTier = 'active' | 'privacy' | 'legal';

interface ScanItem {
  icon: React.ReactNode;
  logo?: string;
  name: string;
  description: string;
  status: ItemStatus;
  value?: string;
  tier?: ItemTier;
}

interface ScanGroup {
  label: string;
  items: ScanItem[];
}

const L = (domain: string) => `https://img.logo.dev/${domain}?token=pk_SVxg-nzqQv6sx6IKaC4yVA`;

const SCAN_GROUPS: ScanGroup[] = [
  {
    label: 'Communication and CRM',
    items: [
      {
        icon: <ChatCircle size={20} weight="fill" />,
        logo: L('intercom.com'),
        name: 'Intercom',
        description: 'Live chat & customer messaging',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
      {
        icon: <UsersThree size={20} weight="fill" />,
        logo: L('hubspot.com'),
        name: 'HubSpot',
        description: 'CRM & marketing automation',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
      {
        icon: <Bell size={20} weight="fill" />,
        logo: L('mailchimp.com'),
        name: 'Mailchimp',
        description: 'Email marketing platform',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
    ],
  },
  {
    label: 'Embedded Third-Party Content',
    items: [
      {
        icon: <MapPin size={20} weight="fill" />,
        logo: L('maps.google.com'),
        name: 'Google Maps',
        description: 'Interactive map embeds',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        icon: <YoutubeLogo size={20} weight="fill" />,
        logo: L('youtube.com'),
        name: 'YouTube',
        description: 'Embedded video content',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        icon: <TextT size={20} weight="fill" />,
        logo: L('fonts.google.com'),
        name: 'Google Fonts',
        description: 'Third-party web fonts',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        icon: <InstagramLogo size={20} weight="fill" />,
        logo: L('linkedin.com'),
        name: 'Social Media Buttons',
        description: 'LinkedIn, Instagram share widgets',
        status: 'detected',
        value: 'LinkedIn, Instagram',
        tier: 'privacy',
      },
      {
        icon: <MegaphoneSimple size={20} weight="fill" />,
        logo: L('meta.com'),
        name: 'Meta Pixel',
        description: 'Facebook tracking & retargeting',
        status: 'warning',
        value: 'Active',
        tier: 'privacy',
      },
    ],
  },
  {
    label: 'Infrastructure and Hosting',
    items: [
      {
        icon: <Cloud size={20} weight="fill" />,
        logo: L('cloudflare.com'),
        name: 'Cloudflare',
        description: 'Hosting & CDN provider',
        status: 'detected',
        value: 'EU-based',
        tier: 'active',
      },
      {
        icon: <CreditCard size={20} weight="fill" />,
        logo: L('stripe.com'),
        name: 'Stripe',
        description: 'Payment processing',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
      {
        icon: <Storefront size={20} weight="fill" />,
        name: 'Online Shop',
        description: 'E-commerce system',
        status: 'not-detected',
        value: 'Not found',
      },
    ],
  },
  {
    label: 'E-Commerce and Forms',
    items: [
      {
        icon: <EnvelopeSimple size={20} weight="fill" />,
        name: 'Contact Form',
        description: 'Collects visitor data',
        status: 'detected',
        value: 'Detected',
        tier: 'legal',
      },
      {
        icon: <Bell size={20} weight="fill" />,
        name: 'Newsletter Sign-Up',
        description: 'Email subscription form',
        status: 'detected',
        value: 'Detected',
        tier: 'legal',
      },
      {
        icon: <UserCircle size={20} weight="fill" />,
        name: 'User Accounts',
        description: 'Registration & login',
        status: 'detected',
        value: 'Detected',
        tier: 'legal',
      },
    ],
  },
  {
    label: 'Security and Technical Services',
    items: [
      {
        icon: <ShieldCheck size={20} weight="fill" />,
        logo: L('cloudflare.com'),
        name: 'Cloudflare CDN',
        description: 'Content delivery & DDoS protection',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        icon: <Cookie size={20} weight="fill" />,
        logo: L('cookiebot.com'),
        name: 'Cookiebot',
        description: 'Cookie consent management',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
      {
        icon: <Robot size={20} weight="fill" />,
        logo: L('google.com'),
        name: 'Google reCAPTCHA',
        description: 'Bot protection',
        status: 'detected',
        value: 'Active',
        tier: 'active',
      },
    ],
  },
  {
    label: 'Analytics and Advertising',
    items: [
      {
        icon: <ChartBar size={20} weight="fill" />,
        logo: L('google.com'),
        name: 'Google Analytics 4',
        description: 'Website analytics & reporting',
        status: 'detected',
        value: 'Active',
        tier: 'privacy',
      },
      {
        icon: <Crosshair size={20} weight="fill" />,
        name: 'Tracking Technologies',
        description: 'Cookies, pixels & fingerprinting scripts',
        status: 'warning',
        value: '12 detected',
        tier: 'privacy',
      },
      {
        icon: <Cookie size={20} weight="fill" />,
        name: 'Cookies in Use',
        description: 'All cookie types combined',
        status: 'warning',
        value: '8 detected',
        tier: 'privacy',
      },
      {
        icon: <MegaphoneSimple size={20} weight="fill" />,
        logo: L('google.com'),
        name: 'Google Ads',
        description: 'Remarketing & conversion tracking',
        status: 'warning',
        value: 'Active',
        tier: 'privacy',
      },
    ],
  },
  {
    label: 'User Accounts and Authentication',
    items: [
      {
        icon: <UserCircle size={20} weight="fill" />,
        name: 'Login System',
        description: 'Custom user account registration',
        status: 'detected',
        value: 'Active',
        tier: 'legal',
      },
      {
        icon: <ShieldCheck size={20} weight="fill" />,
        logo: L('google.com'),
        name: 'Google Sign-In',
        description: 'Single Sign-On via Google',
        status: 'detected',
        value: 'SSO Active',
        tier: 'legal',
      },
    ],
  },
];

const TOTAL_ITEMS = SCAN_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

const STATUS_CONFIG: Record<
  ItemStatus,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  detected: {
    icon: <CheckCircle size={14} weight="fill" />,
    label: 'Detected',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
  },
  'not-detected': {
    icon: <XCircle size={14} weight="fill" />,
    label: 'Not found',
    color: '#9ca3af',
    bg: 'rgba(0,0,0,0.05)',
  },
  warning: {
    icon: <Warning size={14} weight="fill" />,
    label: 'Needs attention',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
  },
};

interface ScanStepProps {
  domain: string;
  onContinue: () => void;
  onBack?: () => void;
  skipLoading?: boolean;
  includeEuRep?: boolean;
  onIncludeEuRepChange?: (value: boolean) => void;
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="shrink-0 animate-spin rounded-full border-2"
      style={{
        width: size,
        height: size,
        borderColor: 'var(--border)',
        borderTopColor: 'var(--accent)',
      }}
    />
  );
}

function LogoIcon({
  logo,
  fallback,
  defaultBg,
  defaultColor,
  faded,
}: {
  logo: string;
  fallback: React.ReactNode;
  defaultBg: string;
  defaultColor: string;
  faded: boolean;
}) {
  const [bg, setBg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 64;
      canvas.height = img.naturalHeight || 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] ?? 0;
        if (alpha > 10) {
          r += data[i] ?? 0;
          g += data[i + 1] ?? 0;
          b += data[i + 2] ?? 0;
          count++;
        }
      }
      if (count > 0)
        setBg(
          `rgba(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)},0.15)`
        );
    } catch {
      /* CORS blocked — keep defaultBg */
    }
  }

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ background: bg ?? defaultBg, color: defaultColor, opacity: faded ? 0.4 : 1 }}
    >
      {failed ? (
        fallback
      ) : (
        <img
          src={logo}
          crossOrigin="anonymous"
          alt=""
          className="h-6 w-6 rounded object-contain"
          onLoad={handleLoad}
          onError={() => {
            setFailed(true);
          }}
        />
      )}
    </div>
  );
}

export function ScanStep({
  domain,
  onContinue,
  onBack,
  skipLoading,
  includeEuRep = false,
  onIncludeEuRepChange,
}: ScanStepProps) {
  const [scannedCount, setScannedCount] = useState(skipLoading ? TOTAL_ITEMS : 0);
  const learnMoreModal = useOverlayState();

  useEffect(() => {
    if (skipLoading) return;
    let count = 0;
    const interval = setInterval(
      () => {
        count++;
        setScannedCount(count);
        if (count >= TOTAL_ITEMS) clearInterval(interval);
      },
      Math.round(12000 / TOTAL_ITEMS)
    );
    return () => {
      clearInterval(interval);
    };
  }, [skipLoading]);

  const isComplete = scannedCount >= TOTAL_ITEMS;

  return (
    <>
      {/* Header */}
      <div className="border-border border-b">
        <Container>
          <div className="border-border flex flex-col gap-3 border-r border-l px-8 pt-16 pb-10">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-4xl font-bold">
                {isComplete ? 'Scan complete.' : `Scanning ${domain}...`}
              </h1>
              {!isComplete && <Spinner size={28} />}
            </div>
            <p className="text-muted max-w-lg text-base leading-relaxed">
              {isComplete
                ? `We detected ${SCAN_GROUPS.length} categories of data processing on your website.`
                : 'Analyzing your website for data processing tools and technologies.'}
            </p>
          </div>
        </Container>
      </div>

      {/* Summary stats */}
      {isComplete &&
        (() => {
          const allItems = SCAN_GROUPS.flatMap((g) => g.items).filter(
            (i) => i.status !== 'not-detected'
          );
          const active = allItems.filter((i) => i.tier === 'active').length;
          const privacy = allItems.filter((i) => i.tier === 'privacy').length;
          const legal = allItems.filter((i) => i.tier === 'legal').length;

          const stats = [
            {
              label: 'Standard tools',
              description: 'Infrastructure, CDN, fonts and other low-risk embeds',
              count: active,
              icon: <Wrench size={32} weight="fill" className="text-blue-500" />,
            },
            {
              label: 'Privacy-sensitive',
              description: 'Tracking pixels, advertising, analytics and cookies',
              count: privacy,
              icon: <Eye size={32} weight="fill" className="text-amber-500" />,
            },
            {
              label: 'Require GDPR disclosure',
              description: 'CRM, forms, payments and user accounts processing personal data',
              count: legal,
              icon: <FileText size={32} weight="fill" className="text-red-500" />,
            },
          ];

          return (
            <div className="border-border border-b">
              <Container>
                <div className="border-border grid grid-cols-3 border-r border-l">
                  {stats.map((s, i) => (
                    <div
                      key={s.label}
                      className={`flex flex-col gap-3 p-8 ${i < stats.length - 1 ? 'border-border border-r' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {s.icon}
                        <span className="text-foreground text-4xl leading-none font-medium tabular-nums">
                          {s.count}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-foreground text-base font-medium">{s.label}</p>
                        <p className="text-muted text-sm leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Container>
            </div>
          );
        })()}

      {/* Results grid */}
      <Container>
        <div className="border-border flex flex-col border-r border-l">
          {SCAN_GROUPS.map((group, groupIndex) => {
            const itemsBefore = SCAN_GROUPS.slice(0, groupIndex).reduce(
              (acc, g) => acc + g.items.length,
              0
            );
            const isAnalytics = group.label === 'Analytics and Advertising';
            return (
              <div key={group.label} className="flex flex-col">
                <div
                  className={`grid ${groupIndex < SCAN_GROUPS.length - 1 ? 'border-border border-b' : ''}`}
                  style={{ gridTemplateColumns: '1fr 1fr' }}
                >
                  {/* Left — category */}
                  <div className="border-border flex flex-col gap-8 border-r p-8">
                    <h2 className="text-xl leading-snug font-semibold" style={{ color: '#525252' }}>
                      {group.label}
                    </h2>
                    {isAnalytics && (
                      <div
                        className="flex flex-col gap-2 rounded-xl px-4 py-4"
                        style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '2px solid rgba(245, 158, 11, 0.4)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">🇪🇺</span>
                          <h3 className="text-foreground text-base font-medium">
                            EU Representative May Be Required
                          </h3>
                        </div>
                        <p className="text-foreground text-xs leading-relaxed">
                          Your website uses analytics, advertising, and tracking technologies that
                          may fall under GDPR requirements for EU/EEA visitors.
                        </p>
                        <p className="text-foreground text-xs leading-relaxed">
                          Under GDPR Article 27, some non-EU companies must appoint an EU
                          Representative.
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs"
                            onPress={() => { learnMoreModal.open(); }}
                          >
                            Learn more
                          </Button>
                          <Switch
                            isSelected={includeEuRep}
                            onChange={onIncludeEuRepChange}
                            className="flex items-center gap-2"
                          >
                            <SwitchControl>
                              <SwitchThumb />
                            </SwitchControl>
                            <SwitchContent className="text-foreground text-xs font-medium">
                              Include in order
                            </SwitchContent>
                          </Switch>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right — items */}
                  <div className="divide-border flex flex-col divide-y">
                    {group.items.map((item, itemIndex) => {
                      const globalIndex = itemsBefore + itemIndex;
                      const isDone = scannedCount > globalIndex;
                      const isScanning = scannedCount === globalIndex;
                      const s = STATUS_CONFIG[item.status];

                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between gap-4 px-8 py-4"
                        >
                          <div className="flex items-center gap-4">
                            {item.logo ? (
                              <LogoIcon
                                logo={item.logo}
                                fallback={item.icon}
                                defaultBg={
                                  item.status === 'warning'
                                    ? 'rgba(217,119,6,0.08)'
                                    : item.status === 'not-detected'
                                      ? 'rgba(0,0,0,0.04)'
                                      : 'rgba(47,84,134,0.07)'
                                }
                                defaultColor={
                                  item.status === 'warning'
                                    ? '#d97706'
                                    : item.status === 'not-detected'
                                      ? '#9ca3af'
                                      : 'var(--accent)'
                                }
                                faded={!isDone && !isScanning}
                              />
                            ) : (
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                  background:
                                    !isDone && !isScanning
                                      ? 'rgba(0,0,0,0.03)'
                                      : item.status === 'warning'
                                        ? 'rgba(217,119,6,0.08)'
                                        : item.status === 'not-detected'
                                          ? 'rgba(0,0,0,0.04)'
                                          : 'rgba(47,84,134,0.07)',
                                  color:
                                    !isDone && !isScanning
                                      ? '#d1d5db'
                                      : item.status === 'warning'
                                        ? '#d97706'
                                        : item.status === 'not-detected'
                                          ? '#9ca3af'
                                          : 'var(--accent)',
                                  opacity: !isDone && !isScanning ? 0.4 : 1,
                                }}
                              >
                                {item.icon}
                              </div>
                            )}
                            <div className="flex flex-col gap-0.5">
                              <h3
                                className="text-base font-semibold"
                                style={{
                                  color: isDone || isScanning ? 'var(--foreground)' : '#9ca3af',
                                }}
                              >
                                {item.name}
                              </h3>
                              <p className="text-muted text-xs">{item.description}</p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isDone ? (
                              <div
                                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                                style={{ background: s.bg, color: s.color }}
                              >
                                {s.icon}
                                <span>{item.value ?? s.label}</span>
                              </div>
                            ) : isScanning ? (
                              <Spinner size={16} />
                            ) : (
                              <div
                                className="h-4 w-4 rounded-full"
                                style={{ background: 'rgba(0,0,0,0.06)' }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 1 }}
          >
            <StepFooter onBack={onBack} onContinue={onContinue} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* EU GDPR — Learn more modal */}
      <ModalRoot state={learnMoreModal}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="md">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>EU GDPR Applicability</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <div className="text-foreground flex flex-col gap-4 text-sm leading-relaxed">
                  <p>
                    The EU General Data Protection Regulation (GDPR) applies to any organisation —
                    regardless of where it is established — that offers goods or services to, or
                    monitors the behaviour of, people located in the EU/EEA.
                  </p>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-foreground font-semibold">
                      When does it apply to your website?
                    </h4>
                    <ul className="text-muted flex list-disc flex-col gap-1.5 pl-5">
                      <li>You sell or ship products to EU customers</li>
                      <li>You offer services in EU languages or accept EU currencies</li>
                      <li>You track visitors from the EU (analytics, ads, retargeting)</li>
                      <li>You collect leads, registrations or newsletter sign-ups from EU users</li>
                    </ul>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-foreground font-semibold">
                      Article 27 — EU Representative
                    </h4>
                    <p className="text-muted">
                      If you are not established in the EU but the GDPR applies to you, you
                      generally must appoint a representative within the EU as the contact point for
                      data subjects and supervisory authorities. Limited exemptions exist for
                      occasional processing of low-risk data.
                    </p>
                  </div>
                  <p className="text-muted">
                    We&apos;ll include the appropriate clauses in your privacy policy based on your
                    answers in the next step.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="primary" onPress={() => { learnMoreModal.close(); }}>
                  Got it
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>
    </>
  );
}
