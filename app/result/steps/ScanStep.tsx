'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
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
} from '@/components/ui';
import { Container } from '@/components/shared/Container';

import {
  SCAN_CAROUSEL_ITEMS,
  SCAN_ITEM_COUNT,
  logoUrl,
  type ScanIconKey,
} from '../content/scan-groups';

const SCAN_ICONS: Record<ScanIconKey, React.ReactNode> = {
  chat: <ChatCircle size={28} weight="fill" />,
  users: <UsersThree size={28} weight="fill" />,
  bell: <Bell size={28} weight="fill" />,
  map: <MapPin size={28} weight="fill" />,
  youtube: <YoutubeLogo size={28} weight="fill" />,
  text: <TextT size={28} weight="fill" />,
  instagram: <InstagramLogo size={28} weight="fill" />,
  megaphone: <MegaphoneSimple size={28} weight="fill" />,
  cloud: <Cloud size={28} weight="fill" />,
  credit: <CreditCard size={28} weight="fill" />,
  storefront: <Storefront size={28} weight="fill" />,
  envelope: <EnvelopeSimple size={28} weight="fill" />,
  user: <UserCircle size={28} weight="fill" />,
  shield: <ShieldCheck size={28} weight="fill" />,
  cookie: <Cookie size={28} weight="fill" />,
  robot: <Robot size={28} weight="fill" />,
  chart: <ChartBar size={28} weight="fill" />,
  crosshair: <Crosshair size={28} weight="fill" />,
};

// Carousel viewport: 7 icons — 7×64 + 6×20 = 568px; sm: 7×72 + 6×24 = 648px

interface ScanStepProps {
  domain: string;
  onContinue: () => void;
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

function CarouselLogo({
  logo,
  fallback,
  name,
}: {
  logo: string;
  fallback: React.ReactNode;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="bg-key-50 text-accent flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:h-[72px] sm:w-[72px]"
      aria-hidden
    >
      {failed ? (
        fallback
      ) : (
        <img
          src={logo}
          alt=""
          className="h-9 w-9 rounded object-contain sm:h-10 sm:w-10"
          onError={() => {
            setFailed(true);
          }}
        />
      )}
      <span className="sr-only">{name}</span>
    </div>
  );
}

function CarouselIcon({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <div
      className="bg-key-50 text-accent flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl sm:h-[72px] sm:w-[72px]"
      aria-hidden
    >
      {icon}
      <span className="sr-only">{name}</span>
    </div>
  );
}

function TechCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reducedMotion = useReducedMotion();
  const items = [...SCAN_CAROUSEL_ITEMS, ...SCAN_CAROUSEL_ITEMS];

  useEffect(() => {
    if (reducedMotion) return;

    let rafId = 0;

    const updateScales = () => {
      const container = containerRef.current;
      if (!container) {
        rafId = requestAnimationFrame(updateScales);
        return;
      }

      const { left, width } = container.getBoundingClientRect();
      const centerX = left + width / 2;
      const halfWidth = width / 2;

      itemRefs.current.forEach((el) => {
        if (!el) return;

        const baseWidth = el.offsetWidth;
        const rect = el.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(itemCenterX - centerX);
        const t = Math.min(distance / halfWidth, 1);
        const scale = 1 - t * t * 0.45;
        const opacity = 1 - t * t;
        const marginOffset = (baseWidth * (1 - scale)) / 2;

        el.style.transform = `scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.marginLeft = `${-marginOffset}px`;
        el.style.marginRight = `${-marginOffset}px`;
      });

      rafId = requestAnimationFrame(updateScales);
    };

    rafId = requestAnimationFrame(updateScales);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-[568px] max-w-full sm:w-[648px]"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%)',
      }}
      aria-hidden
    >
      <div className="animate-scan-tech-marquee flex w-max gap-5 motion-reduce:animate-none sm:gap-6">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className="shrink-0 will-change-transform"
            style={{ transformOrigin: 'center center' }}
          >
            {item.logoDomain ? (
              <CarouselLogo
                logo={logoUrl(item.logoDomain)}
                fallback={SCAN_ICONS[item.iconKey]}
                name={item.name}
              />
            ) : (
              <CarouselIcon icon={SCAN_ICONS[item.iconKey]} name={item.name} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScanStep({ domain, onContinue, skipLoading }: ScanStepProps) {
  const t = useTranslations('result.scanStep');
  const [scannedCount, setScannedCount] = useState(skipLoading ? SCAN_ITEM_COUNT : 0);

  useEffect(() => {
    if (skipLoading) return;

    let count = 0;

    const interval = window.setInterval(
      () => {
        count++;
        setScannedCount(count);
        if (count >= SCAN_ITEM_COUNT) window.clearInterval(interval);
      },
      Math.max(1, Math.round(12000 / SCAN_ITEM_COUNT))
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [skipLoading]);

  const isComplete = scannedCount >= SCAN_ITEM_COUNT;

  useEffect(() => {
    if (!isComplete || skipLoading) return;

    const timeoutId = window.setTimeout(() => {
      onContinue();
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isComplete, skipLoading, onContinue]);

  return (
    <Container className="flex flex-1 flex-col">
      <div className="border-border flex min-h-[min(70dvh,640px)] flex-1 flex-col items-center justify-center overflow-x-hidden border-r border-l px-4 py-16 sm:px-8 sm:py-24">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {isComplete ? t('completeTitle') : t('scanningTitle', { domain })}
            </h1>
            {!isComplete && <Spinner size={28} />}
          </div>
          {!isComplete && (
            <p className="text-muted max-w-lg text-base leading-relaxed">
              {t('scanningDescription')}
            </p>
          )}
        </div>

        {!isComplete && (
          <div className="mt-12 flex w-full justify-center sm:mt-16">
            <TechCarousel />
          </div>
        )}
      </div>
    </Container>
  );
}
