import { Buildings, Cookie, FlagBanner, GraduationCap } from '@/components/ui';
import { getTranslations } from 'next-intl/server';
import { TopBar } from '@/components/shared/TopBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { LandingHeroSection } from '@/components/shared/LandingHeroSection';
import { InsightsSection } from '@/components/shared/InsightsSection';
import { AboutSection } from '@/components/shared/AboutSection';

export default async function LandingPage() {
  const t = await getTranslations('landing');
  const tNav = await getTranslations('nav');

  return (
    <div className="relative flex flex-1 flex-col">
      <TopBar />

      <main className="flex flex-1 flex-col">
        <LandingHeroSection />

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

      <Footer />
    </div>
  );
}
