import type { ReactNode } from 'react';
import { cn } from '@/components/ui';

type FaqSectionFrameProps = {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FaqSectionFrame({ title, intro, children, className }: FaqSectionFrameProps) {
  return (
    <section
      className={cn('border-border border-b', className)}
      aria-labelledby="faq-section-title"
    >
      <div className="px-4 py-10 sm:px-8 sm:py-16 lg:py-20">
        <h2
          id="faq-section-title"
          className="font-display text-foreground mx-auto max-w-3xl text-center text-xl font-semibold sm:text-2xl"
        >
          {title}
        </h2>
        {intro ? (
          <p className="text-foreground mx-auto mt-4 mb-10 max-w-3xl text-center text-base leading-relaxed lg:mb-12">
            {intro}
          </p>
        ) : (
          <div className="mb-10 lg:mb-12" aria-hidden />
        )}
        {children}
      </div>
    </section>
  );
}
