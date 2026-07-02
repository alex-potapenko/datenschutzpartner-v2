import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { InsightsPanel } from '@/components/shared/InsightsPanel';
import { RegularPage } from '@/components/shared/RegularPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('insights');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function InsightsPage() {
  return (
    <RegularPage activePath="/insights" noPadding>
      <InsightsPanel heading="h1" headerClassName="pt-12 pb-6 sm:pt-20 sm:pb-8" />
    </RegularPage>
  );
}
