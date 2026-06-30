import {
  Lock,
  Crosshair,
  Cookie,
  ChartBar,
  EnvelopeSimple,
  Cloud,
  Users,
  ShieldCheck,
  GraduationCap,
  GlobeHemisphereEast,
  Bell,
  CreditCard,
  MapPin,
  Camera,
} from '@/components/ui';
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

export default function LandingPage() {
  return (
    <>
      <TopBar />

      <main>
        {/* Hero */}
        <section className="border-border bg-background border-b">
          <Container>
            <div className="border-border grid items-start border-r border-l lg:grid-cols-2">
              {/* Left */}
              <div className="border-border flex flex-col border-r">
                <div className="flex flex-col gap-10 px-8 pt-20 pb-10">
                  <h1 className="text-foreground text-5xl leading-tight font-bold">
                    Check your website
                    <br />
                    for{' '}
                    <span className="relative inline-block" style={{ color: 'var(--accent)' }}>
                      privacy risks
                      <img
                        src="/risk-underline.svg"
                        alt=""
                        aria-hidden="true"
                        className="absolute -bottom-1 left-0 w-full"
                      />
                    </span>
                    .
                  </h1>
                  <p className="text-foreground max-w-md text-lg leading-relaxed">
                    We scan your website and generate a compliant privacy policy automatically.
                  </p>
                </div>

                <div className="relative z-10 -mx-9 pl-2">
                  <ScanForm />
                </div>

                <div className="flex px-8 py-10">
                  <TrustBadge
                    icon={<Users size={24} />}
                    title="2,400+"
                    subtitle="businesses trust us"
                  />
                  <TrustBadge
                    icon={<ShieldCheck size={24} />}
                    title="Swiss"
                    subtitle="legal expertise"
                  />
                  <TrustBadge icon={<Lock size={24} />} title="GDPR & nFADP" subtitle="compliant" />
                </div>
              </div>

              {/* Right — scan preview */}
              <div className="relative flex h-0 min-h-full items-start justify-center px-16 pt-20">
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: -60,
                    left: -40,
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    background: '#ef4444',
                    opacity: 0.16,
                    filter: 'blur(96px)',
                  }}
                />
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: 80,
                    right: -60,
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    background: '#7c3aed',
                    opacity: 0.16,
                    filter: 'blur(96px)',
                  }}
                />
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: '45%',
                    left: -60,
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    background: '#3b82f6',
                    opacity: 0.16,
                    filter: 'blur(96px)',
                  }}
                />
                <div
                  className="pointer-events-none absolute"
                  style={{
                    bottom: -40,
                    right: -20,
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    background: '#16a34a',
                    opacity: 0.16,
                    filter: 'blur(96px)',
                  }}
                />

                <div
                  className="relative flex w-full justify-center overflow-hidden"
                  style={{
                    maxHeight: '100%',
                    maskImage: 'linear-gradient(to top, transparent 0%, black 30%)',
                    WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 30%)',
                  }}
                >
                  <ScanPreviewCard items={SCAN_ITEMS} />
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Feature cards */}
        <section className="border-border bg-background border-b">
          <Container>
            <div className="border-border grid border-r border-l sm:grid-cols-3">
              <FeatureCard
                icon={<Cookie size={48} weight="fill" />}
                title="Cookie Banner Generator"
                description="Generate a compliant cookie consent banner for your website in minutes."
                linkLabel="Get started"
                href="#"
                borderRight
              />
              <FeatureCard
                icon={<GlobeHemisphereEast size={48} weight="fill" />}
                title="Do you operate in the EU?"
                description="You may be legally required to appoint a representative."
                linkLabel="Learn more"
                href="#"
                borderRight
              />
              <FeatureCard
                icon={<GraduationCap size={48} weight="fill" />}
                title="Academy"
                description="Learn about privacy, compliance and data protection."
                linkLabel="Explore"
                href="#"
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

const SCAN_ITEMS = [
  {
    label: 'Tracking technologies',
    value: '12 detected',
    icon: <Crosshair size={18} />,
    color: '#ef4444',
  },
  { label: 'Cookies in use', value: '8 detected', icon: <Cookie size={18} />, color: '#92400e' },
  {
    label: 'Analytics tools',
    value: 'Google Analytics',
    icon: <ChartBar size={18} />,
    color: '#7c3aed',
  },
  {
    label: 'Contact form',
    value: 'Detected',
    icon: <EnvelopeSimple size={18} />,
    color: '#16a34a',
  },
  { label: 'Hosting', value: 'EU-based', icon: <Cloud size={18} />, color: '#3b82f6' },
  { label: 'Cookie banner', value: 'Detected', icon: <Bell size={18} />, color: '#d97706' },
  { label: 'Payment processor', value: 'Stripe', icon: <CreditCard size={18} />, color: '#6366f1' },
  { label: 'Geolocation', value: 'Detected', icon: <MapPin size={18} />, color: '#f97316' },
  { label: 'Media capture', value: 'Not detected', icon: <Camera size={18} />, color: '#16a34a' },
];
