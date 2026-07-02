import { getTranslations } from 'next-intl/server';
import { GraduationCap } from '@/components/ui';

export async function AcademyHero() {
  const t = await getTranslations('academy.landing');

  return (
    <section className="border-border bg-background border-b">
      <div className="border-border grid items-stretch lg:grid-cols-2">
        <div className="border-border flex flex-col lg:border-r">
          <div className="flex flex-col gap-6 px-4 pt-12 pb-12 sm:gap-10 sm:px-8 sm:pt-20 sm:pb-20">
            <div className="flex flex-col gap-2">
              <p
                className="font-display inline-flex items-center gap-2 text-base font-medium"
                style={{ color: 'var(--accent)' }}
              >
                <GraduationCap size={24} weight="fill" aria-hidden />
                {t('heroTitle')}
              </p>
              <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
                {t('heroHeadlineLine1')}
                <br />
                {t('heroHeadlineLine2')}
              </h1>
            </div>
            <p className="text-foreground max-w-md text-base leading-relaxed sm:text-lg">
              {t('heroSubtitle')}
            </p>
          </div>
        </div>

        <div
          role="img"
          aria-label={t('heroImageAlt')}
          className="relative aspect-[2/1] w-full bg-cover bg-center lg:aspect-auto lg:min-h-[320px]"
          style={{ backgroundImage: "url('/academy.jpg')" }}
        />
      </div>
    </section>
  );
}
