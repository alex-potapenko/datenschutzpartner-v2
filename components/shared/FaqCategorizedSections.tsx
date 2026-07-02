'use client';

import { cn } from '@/components/ui';
import { FaqAccordion, type FaqItem } from '@/components/shared/FaqAccordion';

export type FaqCategorySection = {
  id: string;
  label: string;
  items: FaqItem[];
};

type FaqCategorizedSectionsProps = {
  sections: FaqCategorySection[];
  className?: string;
};

export function FaqCategorizedSections({ sections, className }: FaqCategorizedSectionsProps) {
  return (
    <div className={cn('mx-auto flex max-w-3xl flex-col gap-10 sm:gap-12', className)}>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`faq-category-${section.id}`}>
          <h3
            id={`faq-category-${section.id}`}
            className="text-muted mb-4 text-center font-sans text-base font-semibold sm:text-lg"
          >
            {section.label}
          </h3>
          <FaqAccordion items={section.items} />
        </section>
      ))}
    </div>
  );
}
