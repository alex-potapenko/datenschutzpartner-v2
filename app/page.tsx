import {
  Buildings,
  Cookie,
  FlagBanner,
  GraduationCap,
  Lock,
  ShieldCheck,
  Users,
} from '@/components/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import { TopBar } from '@/components/shared/TopBar';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { Footer } from '@/components/shared/Footer';
import { ScanForm } from '@/components/shared/ScanForm';
import { Container } from '@/components/shared/Container';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { HeroLayerZDebug } from '@/components/shared/HeroLayerZDebug';
import { HeroOrbitSystem } from '@/components/shared/HeroOrbitSystem';
import { InsightsSection } from '@/components/shared/InsightsSection';
import { AboutSection } from '@/components/shared/AboutSection';
import { NewsletterSection } from '@/components/shared/NewsletterSection';

export default async function LandingPage() {
  const locale = await getLocale();
  const t = await getTranslations('landing');
  const tNav = await getTranslations('nav');

  return (
    <div className="relative flex flex-1 flex-col">
      <TopBar />

      <main className="flex flex-1 flex-col">
        <section data-hero-section className="bg-background relative w-full overflow-visible">
          <div aria-hidden data-hero-glow className="pointer-events-none absolute inset-0 z-0">
            <Container className="relative h-full">
              {/* Matches the right grid cell so the glow sits exactly where the illustration is. */}
              <div className="absolute inset-x-4 inset-y-0 sm:inset-x-8 lg:left-1/2 lg:w-auto">
                <HeroGlowOrbs />
              </div>
            </Container>
          </div>

          <div className="pointer-events-none absolute inset-0">
            <HeroOrbitSystem />
          </div>

          <Container className="relative z-20">
            {/* Hero borders match the orbit lines rather than the global border token. */}
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
                className="relative min-h-[280px] sm:min-h-[360px] lg:h-0 lg:min-h-full"
                aria-hidden
              />
            </div>
          </Container>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[2px] bg-[var(--accent)]"
          />
        </section>

        <section className="border-border bg-background relative z-10 border-b">
          <Container>
            <div className="border-border grid border-r border-l lg:grid-cols-2">
              <FeatureCard
                icon={<FlagBanner size={32} weight="fill" />}
                accent="var(--feature-indigo)"
                title={t('featureEuTitle')}
                description={t('featureEuDescription')}
                linkLabel={t('learnMore')}
                href="/eu-rep"
                borderRight
                borderBottom
              />
              <FeatureCard
                icon={<GraduationCap size={32} weight="fill" />}
                accent="var(--feature-purple)"
                title={t('featureAcademyTitle')}
                description={t('featureAcademyDescription')}
                linkLabel={t('learnMore')}
                href="/academy"
                borderBottom
              />
              <FeatureCard
                icon={<Cookie size={32} weight="fill" />}
                accent="var(--feature-yellow)"
                title={t('featureCookieTitle')}
                description={t('featureCookieDescription')}
                linkLabel={t('learnMore')}
                href="/account?section=cookieBanner"
                borderRight
                comingSoon
                comingSoonLabel={tNav('comingSoon')}
              />
              <FeatureCard
                icon={<Buildings size={32} weight="fill" />}
                accent="var(--feature-teal)"
                title={t('featureImprintTitle')}
                description={t('featureImprintDescription')}
                linkLabel={t('learnMore')}
                href="/account?section=imprint"
                comingSoon
                comingSoonLabel={tNav('comingSoon')}
              />
            </div>
          </Container>
        </section>

        <AboutSection />
        <InsightsSection />
      </main>

      <NewsletterSection />
      <Footer />

      {process.env.NODE_ENV !== 'production' ? <HeroLayerZDebug /> : null}
    </div>
  );
}
