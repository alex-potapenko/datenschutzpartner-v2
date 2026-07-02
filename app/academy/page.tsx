import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AcademyHero } from '@/app/academy/_components/AcademyHero';
import { AcademyStatsRow } from '@/app/academy/_components/AcademyStatsRow';
import { AcademyLanding } from '@/app/academy/_components/AcademyLanding';
import { RegularPage } from '@/components/shared/RegularPage';
import { parseInsightsTab } from '@/lib/insights-content';

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('academy');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function AcademyPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const activeTab = parseInsightsTab(tab);

  if (activeTab) {
    redirect(`/insights?tab=${activeTab}`);
  }

  return (
    <RegularPage activePath="/academy" noPadding>
      <AcademyHero />
      <AcademyStatsRow />
      <AcademyLanding />
    </RegularPage>
  );
}
