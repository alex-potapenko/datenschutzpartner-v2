import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalMarkdown } from '@/components/shared/LegalMarkdown';
import { NestedScreenShell } from '@/components/shared/NestedScreenShell';
import { loadLegalMarkdown } from '@/lib/load-legal-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.affiliateTerms');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function AffiliateTermsPage() {
  const t = await getTranslations('legal.affiliateTerms');
  const tFooter = await getTranslations('footer');

  return (
    <NestedScreenShell
      activePath="/affiliate"
      backHref="/affiliate"
      backLabel={t('backToAffiliate')}
      detailTitle={tFooter('affiliate')}
      pageHeader={
        <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('pageTitle')}</h1>
      }
    >
      <LegalMarkdown source={loadLegalMarkdown('affiliate-terms')} skipFirstHeading />
    </NestedScreenShell>
  );
}
