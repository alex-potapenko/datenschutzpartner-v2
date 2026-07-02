'use client';

import { useState } from 'react';
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
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <button
            key={item.id}
            type="button"
            aria-expanded={isOpen}
            onClick={() => {
              setOpenId(isOpen ? null : item.id);
            }}
            className={cn(
              'faq-accordion-item squircle group relative w-full cursor-pointer overflow-hidden text-left transition-shadow',
              isOpen
                ? 'faq-accordion-item--expanded z-[1]'
                : 'faq-accordion-item--collapsed bg-background z-0'
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

            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <p className="text-muted pt-0 pr-4 pb-5 pl-4 text-sm leading-relaxed whitespace-pre-line sm:pr-5 sm:pb-6 sm:pl-6">
                  {item.answer}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
