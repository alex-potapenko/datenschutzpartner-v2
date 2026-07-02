import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { TeamGrid } from './_components/TeamGrid';
import { LegalMarkdown } from '@/components/shared/LegalMarkdown';
import { RegularPage } from '@/components/shared/RegularPage';
import { loadAboutClosingMarkdown } from '@/lib/load-about-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function AboutPage() {
  const t = await getTranslations('about');
  const locale = await getLocale();

  return (
    <RegularPage
      activePath="/about"
      noPadding
      header={
        <>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>
          <p className="text-foreground leading-relaxed">
            {t.rich('intro', {
              imprint: (chunks) => <Link href="/imprint">{chunks}</Link>,
            })}
          </p>
        </>
      }
      media={
        <img
          src="/team.webp"
          alt={t('teamImageAlt')}
          className="border-border block aspect-[16/9] w-full border-b object-cover object-center"
        />
      }
    >
      <TeamGrid />
      <div className="px-4 py-12 sm:px-8 sm:py-16">
        <LegalMarkdown source={loadAboutClosingMarkdown(locale)} />
      </div>
    </RegularPage>
  );
}
