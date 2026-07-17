import { getTranslations } from 'next-intl/server';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
import { FaqSectionFrame } from '@/components/shared/FaqSectionFrame';
import { NavigationLink } from '@/components/shared/NavigationLink';
import {
  ACADEMY_FAQ_CATEGORY_IDS,
  ACADEMY_FAQ_ITEMS_BY_CATEGORY,
} from '@/lib/faq-content/constants';

export async function AcademyFaqSection() {
  const t = await getTranslations('academy.landing.faq');

  const sections = ACADEMY_FAQ_CATEGORY_IDS.map((categoryId) => ({
    id: categoryId,
    label: t(`categories.${categoryId}.label`),
    items: ACADEMY_FAQ_ITEMS_BY_CATEGORY[categoryId].map((itemId) => ({
      id: itemId,
      question: t(`items.${itemId}.question`),
      answer: t(`items.${itemId}.answer`),
    })),
  }));

  return (
    <FaqSectionFrame
      title={t('title')}
      intro={t.rich('intro', {
        contact: (chunks) => (
          <NavigationLink href="/contact" chevron="none">
            {chunks}
          </NavigationLink>
        ),
      })}
    >
      <FaqCategorizedSections sections={sections} />
    </FaqSectionFrame>
  );
}
