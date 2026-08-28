'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, LinkedinLogo, ThreadsLogo, InstagramLogo, Butterfly } from '@/components/ui';
import { Container } from './Container';
import { Logo } from './Logo';

const FOOTER_SECTIONS = [
  {
    headingKey: 'products',
    links: [
      { key: 'privacyGenerator', href: '/scan' },
      { key: 'euRepresentative', href: '#' },
      { key: 'academy', href: '/academy' },
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

  return (
    <footer id="site-footer">
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

              <p className="text-foreground text-sm">
                {t('copyright', { year: new Date().getFullYear() })}
              </p>
            </div>

            <div className="border-border grid grid-cols-3 gap-8 border-b p-4 pt-20 sm:p-8 lg:border-b-0">
              {FOOTER_SECTIONS.map(({ headingKey, links }) => (
                <div key={headingKey} className="flex flex-col gap-4 pt-1">
                  <h3 className="text-muted text-sm font-medium">{t(headingKey)}</h3>
                  <ul className="flex flex-col gap-2.5">
                    {links.map(({ key, href }) => {
                      const active = isFooterLinkActive(pathname, href);
                      const label = t(key);

                      return (
                        <li key={key}>
                          {active ? (
                            <span aria-current="page" className="text-muted text-base font-normal">
                              {label}
                            </span>
                          ) : (
                            <Link
                              href={href}
                              className="text-base font-normal transition-colors hover:text-[var(--link-hover)]"
                              style={{ color: 'var(--accent)' }}
                            >
                              {label}
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
