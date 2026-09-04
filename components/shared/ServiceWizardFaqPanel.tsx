'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
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
    <div className="flex flex-col gap-10 pb-10 sm:gap-12">
      <h1 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">{title}</h1>
      <FaqCategorizedSections sections={sections} className="!mx-0 max-w-none" />
      <p className="text-foreground text-base leading-relaxed">{intro}</p>
    </div>
  );
}
