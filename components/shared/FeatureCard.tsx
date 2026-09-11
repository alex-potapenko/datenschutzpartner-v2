import Link from 'next/link';
import { type ReactNode } from 'react';
import { cn } from '@/components/ui';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { NavigationLink, type NavigationLinkProps } from './NavigationLink';

interface FeatureCardProps {
  icon: ReactNode;
  accent: string;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  linkChevron?: NavigationLinkProps['chevron'];
  borderRight?: boolean;
  borderBottom?: boolean;
  comingSoon?: boolean;
  comingSoonLabel?: string;
  className?: string;
}

export function FeatureCard({
  icon,
  accent,
  title,
  description,
  linkLabel,
  href,
  linkChevron = 'right',
  borderRight = false,
  borderBottom = false,
  comingSoon = false,
  comingSoonLabel,
  className,
}: FeatureCardProps) {
  const rootClassName = cn(
    'bg-background flex flex-col gap-6 px-4 pt-16 pb-4 sm:px-8 sm:pt-16 sm:pb-8',
    comingSoon
      ? 'cursor-default'
      : // Lifts the card above the opaque neighbours, otherwise they paint over its shadow.
        'group relative cursor-pointer transition-shadow hover:z-10 hover:shadow-[var(--shadow-card)]',
    borderRight ? 'border-border lg:border-r' : '',
    borderBottom ? 'border-border border-b' : '',
    className
  );

  const content = (
    <>
      <div
        className="w-fit shrink-0 rounded-xl px-3 py-3 [&_svg]:size-8"
        style={{
          background: `color-mix(in oklab, ${accent} 12%, transparent)`,
          color: accent,
        }}
        aria-hidden
      >
        {icon}
      </div>
      <div>
        <h3
          className={[
            'text-foreground mb-2 text-lg font-semibold',
            comingSoon ? '' : 'transition-colors group-hover:text-[var(--accent)]',
          ].join(' ')}
        >
          {title}
        </h3>
        <p className="text-foreground text-base leading-relaxed">{description}</p>
      </div>
      {comingSoon && comingSoonLabel ? (
        <MetaBadge kind="soon" size="lg" className="w-fit">
          {comingSoonLabel}
        </MetaBadge>
      ) : (
        <NavigationLink
          as="span"
          chevron={linkChevron}
          className="group-hover:text-[var(--link-hover)] group-hover:decoration-[var(--link-underline)]"
        >
          {linkLabel}
        </NavigationLink>
      )}
    </>
  );

  if (comingSoon) {
    return <div className={rootClassName}>{content}</div>;
  }

  return (
    <Link href={href} className={rootClassName}>
      {content}
    </Link>
  );
}
