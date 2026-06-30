import React from 'react';
import { Container } from '@/components/shared/Container';

interface StepHeaderProps {
  title: string;
  description: React.ReactNode;
}

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <div className="border-border border-b">
      <Container>
        <div className="border-border flex flex-col gap-3 border-r border-l px-8 pt-16 pb-10">
          <h1 className="text-foreground text-4xl font-bold">{title}</h1>
          <p className="text-muted text-base leading-relaxed">{description}</p>
        </div>
      </Container>
    </div>
  );
}
