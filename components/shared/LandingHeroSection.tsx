'use client';

import { useState, type Key } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Lock, ShieldCheck, Tabs, Users } from '@/components/ui';
import { useLocale, useTranslations } from 'next-intl';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { ScanForm } from '@/components/shared/ScanForm';
import { Container } from '@/components/shared/Container';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { HeroOrbitSystem } from '@/components/shared/HeroOrbitSystem';
import { cn } from '@/lib/utils';
import { env } from '@/env';

type HeroVisualVariant = 'orbitIcons' | 'clientPortrait';

const HERO_PORTRAIT_SRC = '/martin.png';
const HERO_VARIANT_TRANSITION = { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const };

export function LandingHeroSection() {
  const locale = useLocale();
  const t = useTranslations('landing');
  const shouldReduceMotion = useReducedMotion();
  const [variant, setVariant] = useState<HeroVisualVariant>(
    () => env.NEXT_PUBLIC_HERO_VISUAL ?? 'orbitIcons'
  );

  const showPlanetIcons = variant === 'orbitIcons';
  const showClientPortrait = variant === 'clientPortrait';
  /** Visible on Vercel preview/prod too — not gated on NODE_ENV (production builds hide dev-only UI). */
  const showVariantSwitcher = env.NEXT_PUBLIC_HERO_VARIANT_SWITCHER !== 'disabled';

  return (
    <section data-hero-section className="bg-background relative w-full overflow-hidden">
      <div aria-hidden data-hero-glow className="pointer-events-none absolute inset-0 z-0">
        <Container className="relative h-full">
          <div className="absolute inset-x-4 inset-y-0 sm:inset-x-8 lg:left-1/2 lg:w-auto">
            <HeroGlowOrbs />
          </div>
        </Container>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <HeroOrbitSystem showPlanetIcons={showPlanetIcons} />
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

          <div
            className={cn(
              'relative min-h-[280px] sm:min-h-[360px] lg:h-0 lg:min-h-full',
              showClientPortrait ? 'pointer-events-auto' : 'pointer-events-none'
            )}
            aria-hidden={!showClientPortrait}
          >
            {showVariantSwitcher ? (
              <Tabs
                variant="primary"
                selectedKey={variant}
                onSelectionChange={(key: Key) => {
                  setVariant(key === 'clientPortrait' ? 'clientPortrait' : 'orbitIcons');
                }}
                className="pointer-events-auto absolute top-4 right-4 z-30 w-auto gap-0"
              >
                <Tabs.ListContainer className="!w-auto">
                  <Tabs.List
                    aria-label={t('heroVariantDebugAria')}
                    className="!inline-flex !w-auto max-w-full"
                  >
                    <Tabs.Tab id="orbitIcons" className="!h-auto !w-auto shrink-0">
                      <span className="text-xs font-medium whitespace-nowrap">
                        {t('heroVariantDebugOrbit')}
                      </span>
                      <Tabs.Indicator className="!shadow-none" />
                    </Tabs.Tab>
                    <Tabs.Tab id="clientPortrait" className="!h-auto !w-auto shrink-0">
                      <span className="text-xs font-medium whitespace-nowrap">
                        {t('heroVariantDebugPortrait')}
                      </span>
                      <Tabs.Indicator className="!shadow-none" />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
            ) : null}

            <AnimatePresence mode="wait">
              {showClientPortrait ? (
                <motion.div
                  key="hero-client-portrait"
                  className="relative flex h-full min-h-[inherit] flex-col justify-end px-4 sm:px-8"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : HERO_VARIANT_TRANSITION}
                >
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
                        <p className="m-0">
                          <span className="text-key-500 font-display relative inline font-medium">
                            <span
                              aria-hidden
                              className="text-key-500 font-display pointer-events-none absolute top-[-0.15em] right-[calc(100%+0.2rem)] text-[1.875rem] leading-none select-none"
                            >
                              {t('heroClientQuoteOpen')}
                            </span>
                            {t('heroClientQuoteLine1')}
                            <br />
                            {t('heroClientQuoteLine2')}
                            <span
                              aria-hidden
                              className="text-key-500 font-display pointer-events-none absolute top-[-0.15em] left-[calc(100%+0.2rem)] translate-y-[22px] text-[1.875rem] leading-none select-none"
                            >
                              {t('heroClientQuoteClose')}
                            </span>
                          </span>
                        </p>
                        <cite className="mt-2 block font-normal not-italic">
                          <small className="text-foreground text-sm">
                            {t('heroClientName')}, {t('heroClientRole')}
                          </small>
                        </cite>
                      </blockquote>
                    </figcaption>
                  </figure>
                </motion.div>
              ) : null}
            </AnimatePresence>
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
