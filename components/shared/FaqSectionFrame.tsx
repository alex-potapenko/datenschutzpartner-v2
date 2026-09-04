import type { ReactNode } from 'react';
import { cn } from '@/components/ui';

type FaqSectionFrameProps = {
  id?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FaqSectionFrame({ id, title, intro, children, className }: FaqSectionFrameProps) {
  return (
    <section
      id={id}
      className={cn('border-border scroll-mt-24 border-b', className)}
      aria-labelledby="faq-section-title"
    >
      <div className="px-4 py-10 sm:px-8 sm:py-16 lg:py-20">
        <h2
          id="faq-section-title"
          className="font-display text-foreground mx-auto mb-10 max-w-3xl text-center text-xl font-semibold sm:text-2xl lg:mb-12"
        >
          {title}
        </h2>
        {children}
        {intro ? (
          <p className="text-foreground mx-auto mt-10 max-w-3xl text-center text-base leading-relaxed lg:mt-12">
            {intro}
          </p>
        ) : null}
      </div>
    </section>
  );
}
