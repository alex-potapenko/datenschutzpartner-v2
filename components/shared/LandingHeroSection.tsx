'use client';

import { Lock, ShieldCheck, Users } from '@/components/ui';
import { useLocale, useTranslations } from 'next-intl';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { ScanForm } from '@/components/shared/ScanForm';
import { Container } from '@/components/shared/Container';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { HeroOrbitSystem } from '@/components/shared/HeroOrbitSystem';

const HERO_PORTRAIT_SRC = '/martin.png';

export function LandingHeroSection() {
  const locale = useLocale();
  const t = useTranslations('landing');

  return (
    <section data-hero-section className="bg-background relative w-full overflow-visible">
      <div aria-hidden data-hero-glow className="pointer-events-none absolute inset-0 z-0">
        <Container className="relative h-full">
          <div className="absolute inset-x-4 inset-y-0 sm:inset-x-8 lg:left-1/2 lg:w-auto">
            <HeroGlowOrbs />
          </div>
        </Container>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <HeroOrbitSystem showPlanetIcons={false} />
      </div>

      <Container className="relative z-20">
        <div className="relative grid items-start border-r border-l border-black/[0.06] lg:grid-cols-2">
          <div className="relative flex flex-col border-black/[0.08] max-lg:border-b lg:border-r">
            <div className="flex flex-col gap-6 px-4 pt-12 pb-8 sm:gap-10 sm:px-8 sm:pt-16 lg:pt-20">
              <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
                {t('heroTitleLine1')}
                <br />
                <span className="relative inline-block" style={{ color: 'var(--accent)' }}>
                  {t('heroTitleHighlight')}
                  <img
                    src="/risk-underline.svg"
                    alt=""
                    aria-hidden="true"
                    className={`absolute left-0 w-full origin-bottom ${
                      locale === 'de' ? '-bottom-2 scale-y-50' : '-bottom-2.5'
                    }`}
                  />
                </span>
                .
              </h1>
              <div className="text-foreground flex max-w-md flex-col gap-4 text-base leading-relaxed sm:text-lg">
                <p>{t('heroSubtitle')}</p>
                <NavigationLink href="/scan" chevronWeight="bold" className="font-medium">
                  {t('learnMore')}
                </NavigationLink>
              </div>
            </div>

            <div className="relative z-10 px-4 sm:px-8 lg:-mx-9 lg:px-0 lg:pl-2">
              <ScanForm />
            </div>

            <div className="flex flex-row gap-4 px-4 py-8 sm:px-8 sm:py-10">
              <TrustBadge
                icon={<Users size={24} weight="fill" />}
                title={t('trustBusinesses')}
                subtitle={t('trustBusinessesSub')}
              />
              <TrustBadge
                icon={<ShieldCheck size={24} weight="fill" />}
                title={t('trustSwiss')}
                subtitle={t('trustSwissSub')}
              />
              <TrustBadge
                icon={<Lock size={24} weight="fill" />}
                title={t('trustCompliant')}
                subtitle={t('trustCompliantSub')}
              />
            </div>
          </div>

          <div className="pointer-events-auto relative min-h-[280px] sm:min-h-[360px] lg:h-0 lg:min-h-full">
            <div className="relative flex h-full min-h-[inherit] flex-col justify-end px-4 sm:px-8">
              <figure className="relative m-0 flex h-full min-h-[inherit] w-full flex-col justify-end">
                <img
                  src={HERO_PORTRAIT_SRC}
                  alt={t('heroClientPortraitAlt')}
                  width={480}
                  height={480}
                  className="relative z-10 mx-auto block w-full max-w-[480px] translate-x-[-80px] object-contain object-bottom [filter:drop-shadow(0_16px_40px_color-mix(in_srgb,var(--key-500)_20%,transparent))]"
                />
                <figcaption className="absolute top-[34%] right-0 z-20 w-[min(100%,300px)] translate-x-[100px] translate-y-[112px] sm:top-[36%] sm:w-[min(100%,320px)] lg:top-[38%]">
                  <blockquote className="m-0 text-left text-sm leading-snug">
                    <p className="text-key-500 font-display m-0 inline font-medium">
                      {t('heroClientQuoteLine1')}
                      <br />
                      {t('heroClientQuoteLine2')}
                    </p>
                    <cite className="mt-2 block font-normal not-italic">
                      <small className="text-foreground text-sm">
                        {t('heroClientName')}, {t('heroClientRole')}
                      </small>
                    </cite>
                  </blockquote>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </Container>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[2px] bg-[var(--accent)]"
      />
    </section>
  );
}
