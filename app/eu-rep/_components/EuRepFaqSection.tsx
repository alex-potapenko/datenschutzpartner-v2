import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FaqCategorizedSections } from '@/components/shared/FaqCategorizedSections';
import { FaqSectionFrame } from '@/components/shared/FaqSectionFrame';
import { EU_REP_FAQ_CATEGORY_IDS, EU_REP_FAQ_ITEMS_BY_CATEGORY } from '@/lib/faq-content/constants';

export async function EuRepFaqSection() {
  const t = await getTranslations('euRepPage.faqSection');

  const sections = EU_REP_FAQ_CATEGORY_IDS.map((categoryId) => ({
    id: categoryId,
    label: t(`categories.${categoryId}.label`),
    items: EU_REP_FAQ_ITEMS_BY_CATEGORY[categoryId].map((itemId) => ({
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
          <Link
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:text-[var(--link-hover)]"
          >
            {chunks}
          </Link>
        ),
      })}
    >
      <FaqCategorizedSections sections={sections} />
    </FaqSectionFrame>
  );
}
