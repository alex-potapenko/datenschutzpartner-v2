'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Buildings,
  Button,
  Butterfly,
  CaretRight,
  Cookie,
  FileText,
  FlagBanner,
  GraduationCap,
  InstagramLogo,
  LinkedinLogo,
  ThreadsLogo,
} from '@/components/ui';
import { Container } from './Container';
import { Logo } from './Logo';
import { MetaBadge } from './MetaBadge';

const FOOTER_SECTIONS = [
  {
    headingKey: 'products',
    links: [
      { key: 'privacyGenerator', href: '/scan' },
      { key: 'euRepresentative', href: '/eu-rep' },
      { key: 'academy', href: '/academy' },
      { key: 'cookieBanner', href: '/account?section=cookieBanner' },
      { key: 'imprintGenerator', href: '/account?section=imprint' },
    ],
  },
  {
    headingKey: 'company',
    links: [
      { key: 'insights', href: '/insights' },
      { key: 'aboutUs', href: '/about' },
      { key: 'contact', href: '/contact' },
    ],
  },
  {
    headingKey: 'legal',
    links: [
      { key: 'imprint', href: '/imprint' },
      { key: 'privacyPolicy', href: '/privacy' },
      { key: 'termsOfService', href: '/terms' },
    ],
  },
] as const;

const PRODUCT_ICONS: Record<string, ReactNode> = {
  privacyGenerator: <FileText size={18} weight="fill" aria-hidden />,
  euRepresentative: <FlagBanner size={18} weight="fill" aria-hidden />,
  academy: <GraduationCap size={18} weight="fill" aria-hidden />,
  cookieBanner: <Cookie size={18} weight="fill" aria-hidden />,
  imprintGenerator: <Buildings size={18} weight="fill" aria-hidden />,
};

const PRODUCT_ACCENTS: Record<string, string> = {
  privacyGenerator: 'var(--accent)',
  euRepresentative: 'var(--feature-indigo)',
  academy: 'var(--feature-purple)',
  cookieBanner: 'var(--feature-yellow)',
  imprintGenerator: 'var(--feature-teal)',
};

const COMING_SOON_PRODUCT_KEYS = new Set(['cookieBanner', 'imprintGenerator']);

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/datenschutzpartner',
    icon: <LinkedinLogo size={20} weight="fill" />,
  },
  { label: 'Bluesky', href: 'https://bsky.app', icon: <Butterfly size={20} weight="fill" /> },
  {
    label: 'Threads',
    href: 'https://www.threads.net',
    icon: <ThreadsLogo size={20} weight="fill" />,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com',
    icon: <InstagramLogo size={20} weight="fill" />,
  },
];

function isFooterLinkActive(pathname: string, href: string) {
  if (!href.startsWith('/')) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations('footer');
  const tc = useTranslations('common');
  const tNav = useTranslations('nav');

  return (
    <footer id="site-footer" className="border-t-2" style={{ borderTopColor: 'var(--accent)' }}>
      <Container>
        <div className="border-border relative border-r border-l">
          <div className="border-border flex flex-col-reverse lg:grid lg:grid-cols-2">
            <div className="border-border flex flex-col gap-6 p-4 pt-20 sm:p-8 lg:border-r">
              <Link
                href="/"
                aria-label={tc('home')}
                className="block w-full cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                <Logo inverse={false} />
              </Link>

              <div className="text-foreground flex flex-col gap-1 text-sm">
                <span>{t('tagline')}</span>
                <span>{t('address')}</span>
                <p>
                  <Link href="mailto:info@datenschutzpartner.ch">info@datenschutzpartner.ch</Link>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map(({ label, href, icon }) => (
                  <Button
                    key={label}
                    variant="outline"
                    isIconOnly
                    size="lg"
                    aria-label={label}
                    onPress={() => {
                      window.open(href, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-border grid grid-cols-1 gap-8 border-b p-4 pt-20 sm:grid-cols-3 sm:p-8 lg:grid-cols-[1.5fr_1fr_1fr] lg:border-b-0">
              {FOOTER_SECTIONS.map(({ headingKey, links }) => (
                <div key={headingKey} className="flex flex-col gap-4 pt-1">
                  <h3 className="text-muted text-sm font-medium">{t(headingKey)}</h3>
                  <ul className="flex flex-col gap-2.5">
                    {links.map(({ key, href }) => {
                      const active = isFooterLinkActive(pathname, href);
                      const label = t(key);
                      const icon = headingKey === 'products' ? PRODUCT_ICONS[key] : null;
                      const productAccent =
                        headingKey === 'products' ? PRODUCT_ACCENTS[key] : undefined;
                      const comingSoon =
                        headingKey === 'products' && COMING_SOON_PRODUCT_KEYS.has(key);
                      const content = (
                        <>
                          {!comingSoon ? (
                            <CaretRight
                              size={14}
                              weight="bold"
                              className={[
                                'text-accent absolute top-1/2 left-[-18px] -translate-y-1/2 transition-opacity',
                                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                              ].join(' ')}
                              aria-hidden
                            />
                          ) : null}
                          {icon ? (
                            <span
                              className={
                                comingSoon
                                  ? 'text-muted inline-flex shrink-0'
                                  : 'text-accent inline-flex shrink-0 transition-colors group-hover:text-[var(--product-accent)]'
                              }
                              style={
                                {
                                  '--product-accent': productAccent,
                                } as CSSProperties
                              }
                            >
                              {icon}
                            </span>
                          ) : null}
                          <span>{label}</span>
                          {comingSoon ? (
                            <MetaBadge kind="soon" className="shrink-0">
                              {tNav('soon')}
                            </MetaBadge>
                          ) : null}
                        </>
                      );

                      return (
                        <li key={key}>
                          {comingSoon ? (
                            <span className="text-muted flex flex-wrap items-center gap-2 text-base font-normal">
                              {content}
                            </span>
                          ) : active ? (
                            <span
                              aria-current="page"
                              className="text-foreground relative flex flex-wrap items-center gap-2 text-base font-normal"
                            >
                              {content}
                            </span>
                          ) : (
                            <Link
                              href={href}
                              className="group relative flex flex-wrap items-center gap-2 text-base font-normal transition-colors hover:text-[var(--link-hover)]"
                              style={{ color: 'var(--accent)' }}
                            >
                              {content}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
