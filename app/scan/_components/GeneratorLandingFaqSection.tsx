'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
import { FaqSectionFrame } from '@/components/shared/FaqSectionFrame';
import { NavigationLink } from '@/components/shared/NavigationLink';
import {
  GENERATOR_FAQ_CATEGORY_IDS,
  GENERATOR_FAQ_ITEMS_BY_CATEGORY,
} from '@/lib/faq-content/constants';

export function GeneratorLandingFaqSection() {
  const t = useTranslations('generatorFaq');

  const sections = useMemo(
    () =>
      GENERATOR_FAQ_CATEGORY_IDS.map((categoryId) => ({
        id: categoryId,
        label: t(`categories.${categoryId}.label`),
        items: GENERATOR_FAQ_ITEMS_BY_CATEGORY[categoryId].map((itemId) => ({
          id: itemId,
          question: t(`items.${itemId}.question`),
          answer: t(`items.${itemId}.answer`),
        })),
      })),
    [t]
  );

  return (
    <FaqSectionFrame
      title={t('title')}
      intro={t.rich('introSupport', {
        support: (chunks) => (
          <NavigationLink href="/contact" chevron="none" className="font-medium">
            {chunks}
          </NavigationLink>
        ),
      })}
    >
      <FaqCategorizedSections sections={sections} />
    </FaqSectionFrame>
  );
}
