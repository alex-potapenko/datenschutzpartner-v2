import { getTranslations } from 'next-intl/server';
import { FaqSectionFrame } from '@/components/shared/FaqSectionFrame';
import {
  buildGeneratorFaqIntroSupport,
  GeneratorFaqSections,
} from '@/app/scan/faq/_components/GeneratorFaqSections';

export async function GeneratorFaqSection() {
  const t = await getTranslations('generatorFaq');
  const introSupport = await buildGeneratorFaqIntroSupport();

  return (
    <FaqSectionFrame title={t('title')} intro={introSupport}>
      <GeneratorFaqSections />
    </FaqSectionFrame>
  );
}
