import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { RegularPage } from '@/components/shared/RegularPage';
import {
  EnvelopeSimple,
  MapPin,
  LinkedinLogo,
  ThreadsLogo,
  InstagramLogo,
  Butterfly,
} from '@/components/ui';
import { ContactForm } from './_components/ContactForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/datenschutzpartner',
    icon: <LinkedinLogo size={18} weight="fill" />,
  },
  {
    label: 'Bluesky',
    href: 'https://bsky.app/@datenschutzpartner.ch',
    icon: <Butterfly size={18} weight="fill" />,
  },
  {
    label: 'Threads',
    href: 'https://www.threads.net/@datenschutzpartner',
    icon: <ThreadsLogo size={18} weight="fill" />,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/datenschutzpartner',
    icon: <InstagramLogo size={18} weight="fill" />,
  },
];

export default async function ContactPage() {
  const t = await getTranslations('contact');

  return (
    <RegularPage
      activePath="/contact"
      header={<h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>}
      noPadding
    >
      <div className="grid lg:grid-cols-2">
        <div className="border-border flex flex-col gap-8 border-b p-4 pt-10 sm:p-8 lg:border-r lg:border-b-0">
          <div className="flex flex-col gap-3">
            <h2 className="text-foreground text-xl font-semibold">{t('addressHeading')}</h2>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="mailto:info@datenschutzpartner.ch"
                  className="flex items-center gap-3 font-normal transition-colors hover:text-[var(--link-hover)]"
                  style={{ color: 'var(--accent)' }}
                >
                  <EnvelopeSimple size={18} weight="fill" />
                  info@datenschutzpartner.ch
                </Link>
              </li>
              <li className="flex items-start gap-3">
                <MapPin
                  size={18}
                  weight="fill"
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
                <span className="text-foreground leading-relaxed">{t('addressLine')}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-foreground text-xl font-semibold">{t('socialHeading')}</h2>
            <ul className="flex flex-col gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 font-normal transition-colors hover:text-[var(--link-hover)]"
                    style={{ color: 'var(--accent)' }}
                  >
                    <span style={{ color: 'currentColor' }}>{icon}</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-foreground leading-relaxed">
            {t.rich('note', {
              imprint: (chunks) => <Link href="/imprint">{chunks}</Link>,
            })}
          </p>
        </div>

        <div className="flex flex-col gap-6 p-4 pt-10 sm:p-8">
          <h2 className="text-foreground text-xl font-semibold">{t('formHeading')}</h2>
          <ContactForm />
        </div>
      </div>
    </RegularPage>
  );
}
