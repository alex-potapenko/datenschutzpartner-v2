'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  List,
  UserCircle,
  CaretDown,
  FileText,
  GlobeHemisphereEast,
  GraduationCap,
  Cookie,
} from '@/components/ui';
import {
  Button,
  DropdownRoot,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
} from '@/components/ui';
import { Container } from './Container';
import { Logo } from './Logo';

const SERVICES_LINKS = [
  {
    id: '/scan',
    label: 'Privacy Policy Generator',
    description: 'Create a compliant privacy policy in minutes',
    icon: <FileText size={20} weight="fill" />,
  },
  {
    id: '/cookie-banner',
    label: 'Cookie Banner Generator',
    description: 'Generate a compliant cookie consent banner in minutes',
    icon: <Cookie size={20} weight="fill" />,
  },
  {
    id: '/eu-rep',
    label: 'EU Representative',
    description: 'Appoint your GDPR Article 27 representative',
    icon: <GlobeHemisphereEast size={20} weight="fill" />,
  },
  {
    id: '/academy',
    label: 'Academy',
    description: 'Learn data protection law with our experts',
    icon: <GraduationCap size={20} weight="fill" />,
  },
];

const NAV_LINKS = [
  { label: 'Insights', href: '#' },
  { label: 'About Us', href: '#' },
  { label: 'Contact', href: 'https://www.datenschutzpartner.ch/kontakt/' },
];

interface TopBarProps {
  activePath?: string;
}

export function TopBar({ activePath }: TopBarProps) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setHidden(entry?.isIntersecting ?? false);
      },
      {
        threshold: 0,
      }
    );
    observer.observe(footer);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-50 text-white transition-transform duration-300"
      style={{
        backgroundColor: 'var(--accent)',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      <Container>
        <div className="flex items-stretch border-r border-l border-white/20">
          {/* Logo column */}
          <div className="flex w-1/2 items-center border-r border-white/20 px-8 py-5">
            <Link href="/" aria-label="Home" className="text-white">
              <Logo height={22} />
            </Link>
          </div>

          {/* Nav + Log In */}
          <div className="hidden w-1/2 items-center justify-between px-8 py-5 md:flex">
            <div className="flex items-center gap-5">
              <DropdownRoot>
                <DropdownTrigger className="flex cursor-pointer items-center gap-1 border-0 bg-transparent text-sm font-medium text-white/75 outline-none hover:text-white">
                  Services
                  <CaretDown size={14} />
                </DropdownTrigger>
                <DropdownPopover placement="bottom start" className="mt-1 w-72">
                  <DropdownMenu
                    onAction={(key) => {
                      const item = SERVICES_LINKS.find((l) => l.id === key);
                      if (item) router.push(item.id);
                    }}
                  >
                    {SERVICES_LINKS.map(({ id, label, description, icon }) => (
                      <DropdownItem key={id} textValue={label} className="px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full"
                            style={{ background: 'rgba(47,84,134,0.08)', color: 'var(--accent)' }}
                          >
                            {icon}
                          </div>
                          <div>
                            <p className="text-foreground text-sm font-semibold">{label}</p>
                            <p className="text-muted mt-0.5 text-xs">{description}</p>
                          </div>
                        </div>
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </DropdownPopover>
              </DropdownRoot>

              {NAV_LINKS.map(({ label, href }) => {
                const isActive = activePath === href;
                return (
                  <Link
                    key={label}
                    href={href}
                    className={[
                      'text-sm font-medium whitespace-nowrap transition-colors',
                      isActive ? 'text-white' : 'text-white/75 hover:text-white',
                    ].join(' ')}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="md"
              className="flex items-center gap-1.5 border-white/20 text-white hover:bg-white/10"
            >
              <UserCircle size={18} weight="fill" />
              Log In
            </Button>
          </div>

          {/* Mobile burger */}
          <Button
            variant="ghost"
            isIconOnly
            aria-label="Menu"
            className="mr-3 ml-auto flex text-white/75 hover:bg-white/10 hover:text-white md:hidden"
          >
            <List size={20} />
          </Button>
        </div>
      </Container>
    </header>
  );
}
