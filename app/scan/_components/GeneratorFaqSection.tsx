import { getTranslations } from 'next-intl/server';
import { FaqSectionFrame } from '@/components/shared/FaqSectionFrame';
import {
  buildGeneratorFaqIntroSupport,
  GeneratorFaqSections,
} from '@/app/scan/_components/GeneratorFaqSections';

export async function GeneratorFaqSection() {
  const t = await getTranslations('generatorFaq');
  const introSupport = await buildGeneratorFaqIntroSupport();

  return (
    <FaqSectionFrame id="faq" title={t('title')} intro={introSupport}>
      <GeneratorFaqSections />
    </FaqSectionFrame>
  );
}
