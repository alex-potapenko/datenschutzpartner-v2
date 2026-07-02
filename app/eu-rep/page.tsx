import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RegularPage } from '@/components/shared/RegularPage';
import { EuRepHero } from './_components/EuRepHero';
import { EuRepStatsRow } from './_components/EuRepStatsRow';
import { EuRepBenefitsSection } from './_components/EuRepBenefitsSection';
import { EuRepFaqSection } from './_components/EuRepFaqSection';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('euRepPage');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function EuRepPage() {
  return (
    <RegularPage activePath="/eu-rep" noPadding>
      <EuRepHero />
      <EuRepStatsRow />
      <EuRepBenefitsSection />
      <EuRepFaqSection />
    </RegularPage>
  );
}
