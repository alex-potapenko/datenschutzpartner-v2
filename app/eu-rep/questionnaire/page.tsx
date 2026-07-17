import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { EuRepQuestionnaireFlow } from './_components/EuRepQuestionnaireFlow';
import { EuRepQuestionnaireLayout } from './_components/EuRepQuestionnaireLayout';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('euRepQuestionnaire');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function EuRepQuestionnairePage() {
  const t = await getTranslations('euRepQuestionnaire');

  return (
    <Suspense>
      <EuRepQuestionnaireLayout title={t('title')} intro={t('intro')} backLabel={t('topBarBack')}>
        <EuRepQuestionnaireFlow />
      </EuRepQuestionnaireLayout>
    </Suspense>
  );
}
