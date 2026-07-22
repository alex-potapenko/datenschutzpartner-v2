import React from 'react';
import { Container } from '@/components/shared/Container';

interface StepHeaderProps {
  title: string;
  description?: React.ReactNode;
}

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <div className="border-border border-b">
      <Container>
        <div className="border-border flex flex-col gap-3 border-r border-l px-4 pt-10 pb-8 sm:px-8 sm:pt-16 sm:pb-10">
          <h1 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">{title}</h1>
          {description ? (
            <div className="text-foreground flex flex-col gap-3 text-base leading-relaxed">
              {description}
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
