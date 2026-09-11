'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Buildings,
  CaretDown,
  CaretRight,
  Cookie,
  FileText,
  FlagBanner,
  GraduationCap,
} from '@/components/ui';
import {
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  DropdownTrigger,
} from '@/components/ui';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { topBarNavTriggerClass } from './constants';

type ServiceEntry = {
  id: string;
  key: string;
  icon: ReactNode;
  accent: string;
  comingSoon?: boolean;
};

const SERVICE_IDS: ServiceEntry[] = [
  {
    id: '/scan',
    key: 'privacyGenerator',
    icon: <FileText size={20} weight="fill" />,
    accent: 'var(--accent)',
  },
  {
    id: '/eu-rep',
    key: 'euRep',
    icon: <FlagBanner size={20} weight="fill" />,
    accent: 'var(--feature-indigo)',
  },
  {
    id: '/academy',
    key: 'academy',
    icon: <GraduationCap size={20} weight="fill" />,
    accent: 'var(--feature-purple)',
  },
  {
    id: '/account?section=cookieBanner',
    key: 'cookieBanner',
    icon: <Cookie size={20} weight="fill" />,
    accent: 'var(--feature-yellow)',
    comingSoon: true,
  },
  {
    id: '/account?section=imprint',
    key: 'imprintGenerator',
    icon: <Buildings size={20} weight="fill" />,
    accent: 'var(--feature-teal)',
    comingSoon: true,
  },
];

export const TOPBAR_NAV_LINKS = [
  { key: 'insights', href: '/insights' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
] as const;

function ServiceItemContent({
  serviceKey,
  icon,
  accent,
  comingSoon,
  showCaret = false,
  showDescription = true,
}: {
  serviceKey: string;
  icon: ReactNode;
  accent: string;
  comingSoon?: boolean;
  showCaret?: boolean;
  showDescription?: boolean;
}) {
  const t = useTranslations('nav');
  const ts = useTranslations('services');

  return (
    <>
      <div className="flex min-w-0 items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `color-mix(in oklab, ${accent} 12%, transparent)`,
            color: accent,
          }}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="inline-flex flex-wrap items-center gap-1">
            <span className="font-display text-foreground text-sm font-semibold">
              {ts(`${serviceKey}.label`)}
            </span>
            {comingSoon ? (
              <MetaBadge kind="soon" className="shrink-0">
                {t('soon')}
              </MetaBadge>
            ) : null}
          </div>
          {showDescription ? (
            <p className="text-muted mt-0.5 text-xs leading-relaxed">
              {ts(`${serviceKey}.description`)}
            </p>
          ) : null}
        </div>
      </div>
      {showCaret ? <CaretRight size={14} className="text-muted shrink-0" aria-hidden /> : null}
    </>
  );
}

function ServicesDropdown() {
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const supportsHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const handleMouseEnter = () => {
    if (!supportsHover()) return;
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!supportsHover()) return;
    setIsOpen(false);
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="products-menu"
        className={`${topBarNavTriggerClass} text-white/55 hover:text-white`}
        onClick={() => {
          setIsOpen((open) => (supportsHover() ? true : !open));
        }}
      >
        {t('services')}
        <CaretDown size={14} />
      </button>
      <div
        id="products-menu"
        className={[
          'absolute top-full left-[-74px] z-50 flex w-[min(100vw-2rem,26rem)] pt-2',
          isOpen ? '' : 'pointer-events-none',
        ].join(' ')}
        style={{
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: isOpen
            ? 'opacity 50ms ease-out, visibility 0s'
            : 'opacity 100ms ease-in, visibility 0s linear 100ms',
        }}
      >
        <div
          role="menu"
          className="squircle border-border bg-background flex w-full flex-col gap-1 border p-2 shadow-[var(--shadow-card)]"
        >
          {SERVICE_IDS.map(({ id, key, icon, accent, comingSoon }) =>
            comingSoon ? (
              <div
                key={id}
                role="menuitem"
                aria-disabled="true"
                className="squircle-md cursor-default px-3 py-3"
              >
                <ServiceItemContent
                  serviceKey={key}
                  icon={icon}
                  accent={accent}
                  comingSoon={comingSoon}
                  showCaret={false}
                />
              </div>
            ) : (
              <Link
                key={id}
                role="menuitem"
                href={id}
                className="squircle-md flex items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-black/5"
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                <ServiceItemContent serviceKey={key} icon={icon} accent={accent} showCaret />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function NavPageLinks({
  activePath,
  linkClassName,
}: {
  activePath?: string;
  linkClassName?: string;
}) {
  const t = useTranslations('nav');

  return TOPBAR_NAV_LINKS.map(({ key, href }) => {
    const isActive = activePath === href;
    return (
      <Link
        key={key}
        href={href}
        className={[
          'font-display text-sm font-medium whitespace-nowrap transition-colors',
          isActive ? 'text-white' : 'text-white/55 hover:text-white',
          linkClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {t(key)}
      </Link>
    );
  });
}

function NavPagesDropdown({ activePath, className }: { activePath?: string; className?: string }) {
  const t = useTranslations('nav');
  const isActive = TOPBAR_NAV_LINKS.some(({ href }) => activePath === href);

  return (
    <div className={className}>
      <DropdownRoot>
        <DropdownTrigger
          className={[
            topBarNavTriggerClass,
            isActive ? 'text-white' : 'text-white/55 hover:text-white',
          ].join(' ')}
        >
          {t('company')}
          <CaretDown size={14} />
        </DropdownTrigger>
        <DropdownPopover placement="bottom start" className="mt-1 min-w-44">
          <DropdownMenu>
            {TOPBAR_NAV_LINKS.map(({ key, href }) => (
              <DropdownItem
                key={href}
                id={href}
                href={href}
                textValue={t(key)}
                className="font-display px-4 py-2.5 text-sm"
              >
                {t(key)}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </DropdownPopover>
      </DropdownRoot>
    </div>
  );
}

export function TopBarNav({
  activePath,
  className,
  pagesMode = 'links',
}: {
  activePath?: string;
  className?: string;
  pagesMode?: 'links' | 'responsive';
}) {
  return (
    <nav className={className}>
      <ServicesDropdown />

      {pagesMode === 'links' ? (
        <NavPageLinks activePath={activePath} />
      ) : (
        <>
          <NavPageLinks activePath={activePath} linkClassName="hidden min-[960px]:inline" />
          <NavPagesDropdown activePath={activePath} className="min-[960px]:hidden" />
        </>
      )}
    </nav>
  );
}

export { SERVICE_IDS, ServiceItemContent };
