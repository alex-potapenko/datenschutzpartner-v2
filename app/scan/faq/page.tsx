import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { GeneratorFaqLayout } from './_components/GeneratorFaqLayout';
import {
  buildGeneratorFaqIntroSupport,
  GeneratorFaqSections,
} from './_components/GeneratorFaqSections';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('generatorFaq');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function GeneratorFaqPage() {
  const t = await getTranslations('generatorFaq');
  const introSupport = await buildGeneratorFaqIntroSupport();

  return (
    <Suspense>
      <GeneratorFaqLayout
        title={t('title')}
        introLead={t('introLead')}
        introSupport={introSupport}
        backLabel={t('back')}
      >
        <GeneratorFaqSections />
      </GeneratorFaqLayout>
    </Suspense>
  );
}
