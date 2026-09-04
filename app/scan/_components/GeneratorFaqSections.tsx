import { getTranslations } from 'next-intl/server';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
import { NavigationLink } from '@/components/shared/NavigationLink';
import {
  GENERATOR_FAQ_CATEGORY_IDS,
  GENERATOR_FAQ_ITEMS_BY_CATEGORY,
} from '@/lib/faq-content/constants';

export async function GeneratorFaqSections() {
  const t = await getTranslations('generatorFaq');

  const sections = GENERATOR_FAQ_CATEGORY_IDS.map((categoryId) => ({
    id: categoryId,
    label: t(`categories.${categoryId}.label`),
    items: GENERATOR_FAQ_ITEMS_BY_CATEGORY[categoryId].map((itemId) => ({
      id: itemId,
      question: t(`items.${itemId}.question`),
      answer: t(`items.${itemId}.answer`),
    })),
  }));

  return <FaqCategorizedSections sections={sections} />;
}

export async function buildGeneratorFaqIntroSupport() {
  const t = await getTranslations('generatorFaq');

  return t.rich('introSupport', {
    support: (chunks) => (
      <NavigationLink href="/contact" chevron="none" className="font-medium">
        {chunks}
      </NavigationLink>
    ),
  });
}
