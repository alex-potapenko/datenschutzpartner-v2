import { type ReactNode } from 'react';
import { cn } from '@/components/ui';

interface SectionProps {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'main';
  id?: string;
}

export function Section({ children, className, as: Tag = 'section', id }: SectionProps) {
  return (
    <Tag id={id} className={cn('py-12 sm:py-16', className)}>
      {children}
    </Tag>
  );
}
