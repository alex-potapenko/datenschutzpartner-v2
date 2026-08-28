import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RegularPage } from '@/components/shared/RegularPage';
import { GeneratorBenefitsSection } from './_components/GeneratorBenefitsSection';
import { GeneratorFaqSection } from './_components/GeneratorFaqSection';
import { GeneratorHero } from './_components/GeneratorHero';
import { GeneratorStatsRow } from './_components/GeneratorStatsRow';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('generatorPage');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ fillSubscription?: string }>;
}) {
  const { fillSubscription } = await searchParams;

  return (
    <RegularPage activePath="/scan" noPadding>
      <GeneratorHero fillSubscriptionId={fillSubscription} />
      <GeneratorStatsRow />
      <GeneratorBenefitsSection />
      <GeneratorFaqSection />
    </RegularPage>
  );
}
