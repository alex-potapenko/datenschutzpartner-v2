'use client';

import { useTranslations } from 'next-intl';
import { FullBleedDivider } from '@/components/shared/FullBleedDivider';

export function AffiliateProgramHero() {
  const t = useTranslations('affiliatePage');

  return (
    <section className="bg-background overflow-visible">
      <div className="border-border grid items-stretch overflow-visible lg:grid-cols-2">
        <div className="border-border order-2 flex w-full min-w-0 flex-col border-t lg:order-1 lg:border-t-0 lg:border-r">
          <div className="flex w-full flex-col gap-6 px-4 pt-12 pb-12 sm:gap-10 sm:px-8 sm:pt-20 sm:pb-20">
            <div className="flex flex-col gap-4">
              <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
                {t('title')}
              </h1>
              <p className="text-foreground max-w-xl text-base leading-relaxed font-normal">
                {t('heroLead')}
              </p>
            </div>
          </div>
        </div>

        <div
          role="img"
          aria-label={t('heroImageAlt')}
          className="relative order-1 aspect-[4/3] w-full bg-cover bg-center lg:order-2"
          style={{ backgroundImage: "url('/affiliate.jpg')" }}
        />
      </div>
      <FullBleedDivider />
    </section>
  );
}
