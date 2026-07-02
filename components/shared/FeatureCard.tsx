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
    <Link
      href={href}
      className={[
        'group flex cursor-pointer flex-col gap-6 p-4 pt-16 transition-shadow hover:shadow-[var(--shadow-card)] sm:p-8 sm:pt-24 lg:pt-36',
        borderRight ? 'border-border max-lg:border-b lg:border-r' : '',
      ].join(' ')}
    >
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <div>
        <h3 className="text-foreground mb-2 text-lg font-semibold transition-colors group-hover:text-[var(--accent)]">
          {title}
        </h3>
        <p className="text-foreground text-base leading-relaxed">{description}</p>
      </div>
      <span
        className="inline-flex w-fit items-center gap-1 text-base font-normal transition-colors group-hover:text-[var(--link-hover)]"
        style={{ color: 'var(--accent)' }}
      >
        {linkLabel} <CaretRight size={16} />
      </span>
    </Link>
  );
}
