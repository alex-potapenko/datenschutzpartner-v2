import { getTranslations } from 'next-intl/server';
import { TopBar } from '@/components/shared/TopBar';
import { Footer } from '@/components/shared/Footer';
import { ScanForm } from '@/components/shared/ScanForm';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { Container } from '@/components/shared/Container';
import { Section } from '@/components/shared/Section';

export default async function ScanPage() {
  const t = await getTranslations('scan');

  return (
    <>
      <TopBar activePath="/scan" />
      <main className="flex min-h-[calc(100vh-128px)] flex-col">
        <Section as="div" className="flex flex-1 items-center">
          <Container>
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-foreground mb-10 text-2xl font-bold">{t('title')}</h1>

              <ScanForm className="relative z-10 w-full" />

              <div className="relative mt-6 min-h-72 overflow-visible">
                <HeroGlowOrbs placement="below" />
                <p className="text-muted relative z-10 whitespace-pre-line">{t('subtitle')}</p>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
