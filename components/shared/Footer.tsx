import Link from 'next/link';
import { LinkedinLogo, ThreadsLogo, InstagramLogo, Globe } from '@/components/ui';
import { Container } from './Container';
import { Logo } from './Logo';

const FOOTER_NAV = [
  {
    heading: 'Product',
    links: [
      { label: 'Privacy Generator', href: '/scan' },
      { label: 'EU Representative', href: '#' },
      { label: 'Academy', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Insights', href: '#' },
      { label: 'About us', href: '#' },
      { label: 'Contact', href: 'https://www.datenschutzpartner.ch/kontakt/' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Imprint', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/datenschutzpartner',
    icon: <LinkedinLogo size={20} weight="fill" />,
  },
  { label: 'Bluesky', href: 'https://bsky.app', icon: <Globe size={20} weight="fill" /> },
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

export function Footer() {
  return (
    <footer id="site-footer">
      <Container>
        <div className="border-border relative border-r border-l">
          <div className="border-border grid border-b lg:grid-cols-2">
            {/* Brand & Contacts */}
            <div className="border-border flex flex-col gap-6 border-r p-8 pt-20">
              <Link
                href="/"
                aria-label="Home"
                className="block w-full"
                style={{ color: 'var(--accent)' }}
              >
                <Logo fullWidth />
              </Link>

              <div className="text-foreground flex flex-col gap-1 text-sm">
                <span>Swiss legal expertise for your privacy compliance.</span>
                <span>Datenschutzpartner AG, Hauptstrasse 19, 5742 Kölliken, Schweiz</span>
                <Link
                  href="mailto:info@datenschutzpartner.ch"
                  className="transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  info@datenschutzpartner.ch
                </Link>
              </div>

              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map(({ label, href, icon }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    aria-label={label}
                    className="border-border text-muted hover:border-foreground/30 hover:text-foreground flex size-12 items-center justify-center rounded-xl border transition-colors"
                  >
                    {icon}
                  </Link>
                ))}
              </div>

              <p className="text-foreground text-sm">
                © {new Date().getFullYear()} Datenschutzpartner AG
              </p>
            </div>

            {/* Nav columns */}
            <div className="grid grid-cols-3 gap-8 p-8 pt-20">
              {FOOTER_NAV.map(({ heading, links }) => (
                <div key={heading} className="flex flex-col gap-4">
                  <p className="text-foreground text-base font-medium">{heading}</p>
                  <ul className="flex flex-col gap-2.5">
                    {links.map(({ label, href }) => (
                      <li key={label}>
                        <Link
                          href={href}
                          className="text-base font-medium transition-opacity hover:opacity-70"
                          style={{ color: 'var(--accent)' }}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
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
