'use client';

import { useTranslations } from 'next-intl';
import { BrandGlowBackdrop } from './BrandGlowBackdrop';
import { Container } from './Container';
import { NewsletterSubscribeCard } from './NewsletterSubscribeCard';

export function NewsletterSection() {
  const t = useTranslations('newsletter');

  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border relative flex flex-col items-center gap-8 overflow-hidden border-r border-l px-4 py-12 text-center sm:gap-12 sm:px-8 sm:py-20">
          <BrandGlowBackdrop />

          <div className="relative z-10 flex max-w-2xl flex-col gap-4">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {t('title')}
            </h2>
            <p className="text-foreground text-base leading-relaxed">{t('bodyLine1')}</p>
          </div>

          <div className="relative z-10 w-full shrink-0">
            <NewsletterSubscribeCard />
          </div>
        </div>
      </Container>
    </section>
  );
}
