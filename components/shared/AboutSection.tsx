import { getTranslations } from 'next-intl/server';
import { Container } from './Container';
import { NavigationLink } from './NavigationLink';
import { TeamHeroImage } from './TeamHeroImage';

export async function AboutSection() {
  const t = await getTranslations('aboutSection');

  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border relative flex flex-col items-start gap-8 border-r border-l p-4 pt-16 sm:p-8 sm:pt-24 lg:flex-row lg:gap-24 lg:pt-36">
          <div className="flex w-full shrink-0 flex-col gap-6 lg:w-1/3">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {t('title')}
            </h2>
            <p className="text-foreground text-base leading-relaxed">{t('body')}</p>
            <div>
              <NavigationLink href="/about">{t('learnMore')}</NavigationLink>
            </div>
          </div>

          <div className="squircle w-full min-w-0 lg:w-2/3 lg:shrink-0">
            <TeamHeroImage alt={t('imageAlt')} />
          </div>
        </div>
      </Container>
    </section>
  );
}
