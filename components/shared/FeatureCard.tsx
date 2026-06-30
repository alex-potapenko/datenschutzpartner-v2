import Link from 'next/link';
import { type ReactNode } from 'react';
import { CaretRight } from '@/components/ui';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  borderRight?: boolean;
}

export function FeatureCard({
  icon,
  title,
  description,
  linkLabel,
  href,
  borderRight = false,
}: FeatureCardProps) {
  return (
    <div
      className={[
        'group flex flex-col gap-6 p-8 pt-36 transition-shadow hover:shadow-[var(--shadow-card)]',
        borderRight ? 'border-border border-r' : '',
      ].join(' ')}
    >
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <div>
        <h3 className="text-foreground mb-2 text-xl font-semibold transition-colors group-hover:text-[var(--accent)]">
          {title}
        </h3>
        <p className="text-foreground text-base leading-relaxed">{description}</p>
      </div>
      <div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-base font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          {linkLabel} <CaretRight size={16} />
        </Link>
      </div>
    </div>
  );
}
