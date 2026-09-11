import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AcademyHero } from '@/app/academy/_components/AcademyHero';
import { AcademyStatsRow } from '@/app/academy/_components/AcademyStatsRow';
import { AcademyLanding } from '@/app/academy/_components/AcademyLanding';
import { RegularPage } from '@/components/shared/RegularPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('academy');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function AcademyPage() {
  return (
    <RegularPage activePath="/academy" noPadding>
      <AcademyHero />
      <AcademyStatsRow />
      <AcademyLanding />
    </RegularPage>
  );
}
