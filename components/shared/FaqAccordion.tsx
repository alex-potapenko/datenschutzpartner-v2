'use client';

import { useId, useState } from 'react';
import { cn, Plus } from '@/components/ui';

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
  className?: string;
};

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);
  const isStackActive = openId !== null;

  return (
    <div
      className={cn(
        'faq-accordion-scale',
        isStackActive && 'faq-accordion-scale--active',
        className
      )}
    >
      <div
        className={cn(
          'faq-accordion-item squircle relative z-0',
          isStackActive ? 'faq-accordion-item--expanded z-[1] overflow-visible' : 'overflow-hidden'
        )}
      >
        {items.map((item, index) => {
          const isOpen = openId === item.id;
          const triggerId = `${baseId}-${item.id}-trigger`;
          const panelId = `${baseId}-${item.id}-panel`;

          return (
            <div key={item.id} className="faq-accordion-entry">
              {index > 0 ? <div aria-hidden className="faq-accordion-divider" /> : null}
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  setOpenId(isOpen ? null : item.id);
                }}
                className={cn(
                  'faq-accordion-row group relative w-full cursor-pointer text-left',
                  isOpen && 'faq-accordion-row--expanded'
                )}
              >
                <span className="flex w-full items-start justify-between gap-4 py-4 pr-4 pl-4 sm:py-5 sm:pr-5 sm:pl-6">
                  <span
                    className={cn(
                      'text-base leading-snug font-semibold transition-colors',
                      isOpen ? 'text-[var(--accent)]' : 'group-hover:text-[var(--accent)]'
                    )}
                  >
                    {item.question}
                  </span>
                  <Plus
                    size={20}
                    weight="bold"
                    aria-hidden
                    className={cn(
                      'text-accent mt-0.5 shrink-0 transition-transform duration-200 ease-out',
                      isOpen && 'rotate-45'
                    )}
                  />
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className={cn(
                  'grid min-h-0 transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  {isOpen ? (
                    <p className="text-foreground pr-4 pb-5 pl-4 text-base leading-relaxed whitespace-pre-line sm:pr-5 sm:pb-6 sm:pl-6">
                      {item.answer}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
