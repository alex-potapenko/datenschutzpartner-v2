'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CaretRight } from '@/components/ui';
import { FullBleedDivider } from '@/components/shared/FullBleedDivider';
import { AFFILIATE_REGISTER_HREF } from '@/lib/affiliate-links';

type AffiliateProgramHeroProps = {
  registerHref?: string;
};

export function AffiliateProgramHero({
  registerHref = AFFILIATE_REGISTER_HREF,
}: AffiliateProgramHeroProps) {
  const t = useTranslations('affiliatePage');

  return (
    <section className="bg-background">
      <div className="border-border grid items-stretch lg:grid-cols-2">
        <div className="border-border order-2 flex w-full min-w-0 flex-col border-t lg:order-1 lg:border-t-0 lg:border-r">
          <div className="flex w-full flex-col gap-6 px-4 pt-12 pb-12 sm:gap-10 sm:px-8 sm:pt-20 sm:pb-20">
            <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
              {t('title')}
            </h1>

            <Link
              href={registerHref}
              className="font-display bg-key-500 inline-flex h-14 w-fit items-center justify-center gap-2 rounded-full px-8 text-base font-bold text-white transition-opacity hover:opacity-90"
            >
              {t('registerCta')}
              <CaretRight size={16} weight="bold" aria-hidden />
            </Link>
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
