import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalMarkdown } from '@/components/shared/LegalMarkdown';
import { RegularPage } from '@/components/shared/RegularPage';
import { loadLegalMarkdown } from '@/lib/load-legal-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.imprint');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function ImprintPage() {
  const t = await getTranslations('legal.imprint');

  return (
    <RegularPage
      header={<h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('pageTitle')}</h1>}
    >
      <LegalMarkdown source={loadLegalMarkdown('imprint')} skipFirstHeading />
    </RegularPage>
  );
}
