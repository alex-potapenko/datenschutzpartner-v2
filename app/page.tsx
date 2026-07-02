import {
  Lock,
  Crosshair,
  Cookie,
  ChartBar,
  EnvelopeSimple,
  Cloud,
  Users,
  ShieldCheck,
  GlobeHemisphereEast,
  GraduationCap,
  Bell,
  CreditCard,
  MapPin,
  Camera,
} from '@/components/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import { TopBar } from '@/components/shared/TopBar';
import { Footer } from '@/components/shared/Footer';
import { ScanForm } from '@/components/shared/ScanForm';
import { Container } from '@/components/shared/Container';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { ScanPreviewCard } from '@/components/shared/ScanPreviewCard';
import { InsightsSection } from '@/components/shared/InsightsSection';
import { AboutSection } from '@/components/shared/AboutSection';
import { NewsletterSection } from '@/components/shared/NewsletterSection';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';

export default async function LandingPage() {
  const locale = await getLocale();
  const t = await getTranslations('landing');

  const scanItems = [
    {
      label: t('scanItemTracking'),
      value: t('scanItemTrackingValue'),
      icon: <Crosshair size={18} />,
      color: '#ef4444',
    },
    {
      label: t('scanItemCookies'),
      value: t('scanItemCookiesValue'),
      icon: <Cookie size={18} />,
      color: '#92400e',
    },
    {
      label: t('scanItemAnalytics'),
      value: t('scanItemAnalyticsValue'),
      icon: <ChartBar size={18} />,
      color: '#7c3aed',
    },
    {
      label: t('scanItemContactForm'),
      value: t('scanItemDetected'),
      icon: <EnvelopeSimple size={18} />,
      color: '#16a34a',
    },
    {
      label: t('scanItemHosting'),
      value: t('scanItemHostingValue'),
      icon: <Cloud size={18} />,
      color: '#3b82f6',
    },
    {
      label: t('scanItemCookieBanner'),
      value: t('scanItemDetected'),
      icon: <Bell size={18} />,
      color: '#d97706',
    },
    {
      label: t('scanItemPayment'),
      value: t('scanItemPaymentValue'),
      icon: <CreditCard size={18} />,
      color: '#6366f1',
    },
    {
      label: t('scanItemGeolocation'),
      value: t('scanItemDetected'),
      icon: <MapPin size={18} />,
      color: '#f97316',
    },
    {
      label: t('scanItemMediaCapture'),
      value: t('scanItemNotDetected'),
      icon: <Camera size={18} />,
      color: '#16a34a',
    },
  ];

  const scanPreviewLabels = {
    scan: t('scanPreviewScan'),
    issues: t('scanPreviewIssues'),
    privacyPolicy: t('scanPreviewPolicy'),
    complete: t('scanPreviewComplete'),
    issuesFound: t('scanPreviewIssuesFound'),
    notCompliant: t('scanPreviewNotCompliant'),
  };

  return (
    <>
      <TopBar />

      <main>
        <section className="border-border bg-background border-b">
          <Container>
            <div className="border-border grid items-start border-r border-l lg:grid-cols-2">
              <div className="border-border flex flex-col max-lg:border-b lg:border-r">
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
                  <p className="text-foreground max-w-md text-base leading-relaxed sm:text-lg">
                    {t('heroSubtitle')}
                  </p>
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

              <div className="relative flex items-start justify-center px-4 pt-10 pb-12 sm:px-16 sm:pt-16 lg:h-0 lg:min-h-full lg:pt-20 lg:pb-0">
                <div className="pointer-events-none absolute inset-0 z-0 overflow-visible">
                  <HeroGlowOrbs />
                </div>

                <div className="hero-preview-fade relative z-10 flex w-full justify-center">
                  <ScanPreviewCard items={scanItems} labels={scanPreviewLabels} />
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-border bg-background border-b">
          <Container>
            <div className="border-border grid border-r border-l lg:grid-cols-2">
              <FeatureCard
                icon={<GlobeHemisphereEast size={48} weight="fill" />}
                title={t('featureEuTitle')}
                description={t('featureEuDescription')}
                linkLabel={t('learnMore')}
                href="/eu-rep"
                borderRight
              />
              <FeatureCard
                icon={<GraduationCap size={48} weight="fill" />}
                title={t('featureAcademyTitle')}
                description={t('featureAcademyDescription')}
                linkLabel={t('learnMore')}
                href="/academy"
              />
            </div>
          </Container>
        </section>

        <AboutSection />
        <InsightsSection />
      </main>

      <NewsletterSection />
      <Footer />
    </>
  );
}
