'use client';

import { useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { EnvelopeSimple } from '@/components/ui';
import { BrandGlowBackdrop } from './BrandGlowBackdrop';
import { Container } from './Container';

export function NewsletterSection() {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border relative flex flex-col items-center gap-8 overflow-hidden border-r border-l px-4 py-12 text-center sm:gap-12 sm:px-8 sm:py-20">
          <BrandGlowBackdrop />

          <div className="relative z-10 flex max-w-2xl flex-col gap-4">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {t('title')}
            </h2>
            <p className="text-foreground text-base leading-relaxed">
              {t('bodyLine1')}
              <br className="hidden sm:inline" /> {t('bodyLine2')}
            </p>
          </div>

          <div className="relative z-10 w-full max-w-xl shrink-0">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: 'rgba(47,84,134,0.08)' }}
                >
                  <EnvelopeSimple size={24} weight="fill" style={{ color: 'var(--accent)' }} />
                </div>
                <p className="text-foreground text-base font-semibold">{t('successTitle')}</p>
                <p className="text-muted text-sm">{t('successBody')}</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-5"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  placeholder={t('placeholder')}
                  required
                  className="text-foreground placeholder:text-muted min-w-0 flex-1 bg-transparent px-2 text-base outline-none sm:px-0"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full shrink-0 gap-2 rounded-full sm:w-auto"
                >
                  {t('subscribe')}
                </Button>
              </form>
            )}
            <p className="text-muted mt-3 text-center text-xs">
              {t('privacyPrefix')}{' '}
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {t('privacyLink')}
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
