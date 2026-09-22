import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RegularPage } from '@/components/shared/RegularPage';
import { AffiliateHero } from './_components/AffiliateHero';
import { AffiliateHowItWorksSection } from './_components/AffiliateHowItWorksSection';
import { AffiliateStatsRow } from './_components/AffiliateStatsRow';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('affiliatePage');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function AffiliatePage() {
  return (
    <RegularPage activePath="/affiliate" noPadding>
      <AffiliateHero />
      <AffiliateStatsRow />
      <AffiliateHowItWorksSection />
    </RegularPage>
  );
}
