'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

import {
  SCAN_GROUP_DEFINITIONS,
  SCAN_ITEM_COUNT,
  logoUrl,
  type ScanIconKey,
  type ScanItemStatus,
  type ScanItemTier,
} from '../content/scan-groups';

interface ScanItem {
  icon: React.ReactNode;
  logo?: string;
  name: string;
  description: string;
  status: ScanItemStatus;
  value?: string;
  tier?: ScanItemTier;
}

interface ScanGroup {
  label: string;
  items: ScanItem[];
}

const SCAN_ICONS: Record<ScanIconKey, React.ReactNode> = {
  chat: <ChatCircle size={20} weight="fill" />,
  users: <UsersThree size={20} weight="fill" />,
  bell: <Bell size={20} weight="fill" />,
  map: <MapPin size={20} weight="fill" />,
  youtube: <YoutubeLogo size={20} weight="fill" />,
  text: <TextT size={20} weight="fill" />,
  instagram: <InstagramLogo size={20} weight="fill" />,
  megaphone: <MegaphoneSimple size={20} weight="fill" />,
  cloud: <Cloud size={20} weight="fill" />,
  credit: <CreditCard size={20} weight="fill" />,
  storefront: <Storefront size={20} weight="fill" />,
  envelope: <EnvelopeSimple size={20} weight="fill" />,
  user: <UserCircle size={20} weight="fill" />,
  shield: <ShieldCheck size={20} weight="fill" />,
  cookie: <Cookie size={20} weight="fill" />,
  robot: <Robot size={20} weight="fill" />,
  chart: <ChartBar size={20} weight="fill" />,
  crosshair: <Crosshair size={20} weight="fill" />,
};

const SCAN_GROUPS: ScanGroup[] = SCAN_GROUP_DEFINITIONS.map((group) => ({
  label: group.label,
  items: group.items.map((item) => ({
    icon: SCAN_ICONS[item.iconKey],
    logo: item.logoDomain ? logoUrl(item.logoDomain) : undefined,
    name: item.name,
    description: item.description,
    status: item.status,
    value: item.value,
    tier: item.tier,
  })),
}));

const TOTAL_ITEMS = SCAN_ITEM_COUNT;

const STATUS_CONFIG: Record<
  ScanItemStatus,
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

export function ScanStep({ domain, onContinue, onBack, skipLoading }: ScanStepProps) {
  const [scannedCount, setScannedCount] = useState(skipLoading ? TOTAL_ITEMS : 0);

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

  const visibleGroups = SCAN_GROUPS.map((group, groupIndex) => {
    const itemsBefore = SCAN_GROUPS.slice(0, groupIndex).reduce(
      (acc, g) => acc + g.items.length,
      0
    );

    const visibleItems = group.items
      .map((item, itemIndex) => ({
        item,
        globalIndex: itemsBefore + itemIndex,
      }))
      .filter(({ globalIndex }) => globalIndex <= scannedCount);

    return { group, visibleItems };
  }).filter(({ visibleItems }) => visibleItems.length > 0);

  return (
    <>
      <div className="border-border border-b">
        <Container>
          <div className="border-border flex flex-col gap-3 border-r border-l px-4 pt-10 pb-8 sm:px-8 sm:pt-16 sm:pb-10">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
                {isComplete ? 'Scan complete.' : `Scanning ${domain}...`}
              </h1>
              {!isComplete && <Spinner size={28} />}
            </div>
            {!isComplete && (
              <p className="text-muted max-w-lg text-base leading-relaxed">
                Analyzing your website for data processing tools and technologies.
              </p>
            )}
          </div>
        </Container>
      </div>

      {isComplete && (
        <div className="border-border border-b">
          <Container>
            <div className="border-border grid grid-cols-1 border-r border-l sm:grid-cols-3">
              {(() => {
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

                return stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={`border-border flex flex-col gap-3 p-4 sm:p-8 ${i < stats.length - 1 ? 'max-sm:border-b sm:border-r' : ''}`}
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
                ));
              })()}
            </div>
          </Container>
        </div>
      )}

      <Container>
        <div className="border-border flex flex-col border-r border-l">
          {visibleGroups.map(({ group, visibleItems }, visibleIndex) => (
            <div key={group.label} className="flex flex-col">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 ${visibleIndex < visibleGroups.length - 1 || isComplete ? 'border-border border-b' : ''}`}
              >
                <div className="border-border flex flex-col gap-5 border-b p-4 sm:gap-8 sm:p-8 lg:border-r lg:border-b-0">
                  <h2 className="text-lg leading-snug font-semibold" style={{ color: '#525252' }}>
                    {group.label}
                  </h2>
                </div>

                <div className="divide-border flex flex-col divide-y">
                  <AnimatePresence initial={false}>
                    {visibleItems.map(({ item, globalIndex }) => {
                      const isDone = scannedCount > globalIndex;
                      const isScanning = scannedCount === globalIndex;
                      const s = STATUS_CONFIG[item.status];

                      return (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                          className="flex items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-8"
                        >
                          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
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
                                faded={isScanning}
                              />
                            ) : (
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                  background: isScanning
                                    ? 'rgba(0,0,0,0.03)'
                                    : item.status === 'warning'
                                      ? 'rgba(217,119,6,0.08)'
                                      : item.status === 'not-detected'
                                        ? 'rgba(0,0,0,0.04)'
                                        : 'rgba(47,84,134,0.07)',
                                  color: isScanning
                                    ? '#d1d5db'
                                    : item.status === 'warning'
                                      ? '#d97706'
                                      : item.status === 'not-detected'
                                        ? '#9ca3af'
                                        : 'var(--accent)',
                                  opacity: isScanning ? 0.4 : 1,
                                }}
                              >
                                {item.icon}
                              </div>
                            )}
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <h3
                                className="truncate !font-sans text-base font-semibold"
                                style={{
                                  color: isScanning ? '#9ca3af' : 'var(--foreground)',
                                }}
                              >
                                {item.name}
                              </h3>
                              <p className="text-muted truncate text-xs">{item.description}</p>
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
                            ) : (
                              <Spinner size={16} />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
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
    </>
  );
}
