'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
import { FaqSectionFrame } from '@/components/shared/FaqSectionFrame';
import { NavigationLink } from '@/components/shared/NavigationLink';
import {
  EU_REP_FAQ_CATEGORY_IDS,
  EU_REP_FAQ_ITEMS_BY_CATEGORY,
  GENERATOR_FAQ_CATEGORY_IDS,
  GENERATOR_FAQ_ITEMS_BY_CATEGORY,
} from '@/lib/faq-content/constants';

type ServiceWizardFaqPanelProps = {
  variant: 'generator' | 'euRep';
};

export function ServiceWizardFaqPanel({ variant }: ServiceWizardFaqPanelProps) {
  const tGenerator = useTranslations('generatorFaq');
  const tEuRep = useTranslations('euRepPage.faqSection');

  const sections = useMemo(() => {
    if (variant === 'generator') {
      return GENERATOR_FAQ_CATEGORY_IDS.map((categoryId) => ({
        id: categoryId,
        label: tGenerator(`categories.${categoryId}.label`),
        items: GENERATOR_FAQ_ITEMS_BY_CATEGORY[categoryId].map((itemId) => ({
          id: itemId,
          question: tGenerator(`items.${itemId}.question`),
          answer: tGenerator(`items.${itemId}.answer`),
        })),
      }));
    }

    return EU_REP_FAQ_CATEGORY_IDS.map((categoryId) => ({
      id: categoryId,
      label: tEuRep(`categories.${categoryId}.label`),
      items: EU_REP_FAQ_ITEMS_BY_CATEGORY[categoryId].map((itemId) => ({
        id: itemId,
        question: tEuRep(`items.${itemId}.question`),
        answer: tEuRep(`items.${itemId}.answer`),
      })),
    }));
  }, [tEuRep, tGenerator, variant]);

  const title = variant === 'generator' ? tGenerator('title') : tEuRep('title');
  const intro =
    variant === 'generator'
      ? tGenerator.rich('introSupport', {
          support: (chunks) => (
            <NavigationLink href="/contact" chevron="none" className="font-medium">
              {chunks}
            </NavigationLink>
          ),
        })
      : tEuRep.rich('intro', {
          contact: (chunks) => (
            <NavigationLink href="/contact" chevron="none">
              {chunks}
            </NavigationLink>
          ),
        });

  return (
    <FaqSectionFrame title={title} intro={intro} className="scroll-mt-0 border-0">
      <FaqCategorizedSections sections={sections} />
    </FaqSectionFrame>
  );
}
