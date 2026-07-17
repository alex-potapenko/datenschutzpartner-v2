import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { GraduationCap } from '@/components/ui';

export async function AcademyHero() {
  const t = await getTranslations('academy.landing');

  return (
    <section className="border-border bg-background border-b">
      <div className="border-border grid items-stretch lg:grid-cols-2">
        <div className="border-border order-2 flex w-full min-w-0 flex-col border-t lg:order-1 lg:border-t-0 lg:border-r">
          <div className="flex w-full flex-col gap-6 px-4 pt-12 pb-12 sm:gap-10 sm:px-8 sm:pt-20 sm:pb-20">
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
            <div className="flex w-full flex-col gap-4 text-base leading-relaxed sm:text-lg">
              <p className="text-foreground">{t('heroIntro')}</p>
              <p className="text-foreground">{t('heroSubtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#membership"
                className="font-display inline-flex h-14 w-fit items-center justify-center rounded-full px-8 text-base font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                {t('joinCta')}
              </Link>
              <Link
                href="#materials"
                className="button button--outline button--lg font-display h-14 w-fit rounded-full px-8 text-base"
              >
                {t('seeMaterialsCta')}
              </Link>
            </div>
          </div>
        </div>

        <div
          role="img"
          aria-label={t('heroImageAlt')}
          className="relative order-1 aspect-[2/1] w-full bg-cover bg-center lg:order-2 lg:aspect-auto lg:min-h-[320px]"
          style={{ backgroundImage: "url('/academy.jpg')" }}
        />
      </div>
    </section>
  );
}
