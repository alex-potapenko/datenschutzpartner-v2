'use client';

import Link from 'next/link';
import type { MouseEventHandler, PointerEventHandler, ReactNode } from 'react';
import { CaretLeft, CaretRight, cn } from '@/components/ui';

export type NavigationLinkSize = 'default' | 'sm';

const NAVIGATION_LINK_SIZES: Record<
  NavigationLinkSize,
  { textClassName: string; gapClassName: string; iconSize: number }
> = {
  default: { textClassName: 'text-base', gapClassName: 'gap-1', iconSize: 16 },
  sm: { textClassName: 'text-sm', gapClassName: 'gap-0.5', iconSize: 14 },
};

export function navigationLinkClassName(size: NavigationLinkSize = 'default') {
  const { textClassName, gapClassName } = NAVIGATION_LINK_SIZES[size];

  return cn(
    'inline-flex w-fit items-center font-normal text-accent underline decoration-transparent decoration-1 underline-offset-[3px] transition-[color,text-decoration-color] hover:text-[var(--link-hover)] hover:decoration-[var(--link-underline)]',
    gapClassName,
    textClassName
  );
}

type NavigationLinkBaseProps = {
  children: ReactNode;
  className?: string;
  size?: NavigationLinkSize;
  chevron?: 'left' | 'right' | 'none';
  chevronWeight?: 'regular' | 'bold';
};

type NavigationLinkAsLink = NavigationLinkBaseProps & {
  href: string;
  target?: '_blank' | '_self';
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  onPointerDown?: PointerEventHandler<HTMLAnchorElement>;
  onPress?: never;
  as?: never;
};

type NavigationLinkAsButton = NavigationLinkBaseProps & {
  href?: never;
  onPress: () => void;
  as?: never;
  type?: 'button' | 'submit';
};

type NavigationLinkAsSpan = NavigationLinkBaseProps & {
  href?: never;
  onPress?: never;
  as: 'span';
};

export type NavigationLinkProps =
  | NavigationLinkAsLink
  | NavigationLinkAsButton
  | NavigationLinkAsSpan;

function Chevron({
  side,
  weight,
  size,
}: {
  side: 'left' | 'right';
  weight: 'regular' | 'bold';
  size: NavigationLinkSize;
}) {
  const Icon = side === 'left' ? CaretLeft : CaretRight;
  const { iconSize } = NAVIGATION_LINK_SIZES[size];

  return <Icon size={iconSize} weight={weight} aria-hidden className="shrink-0" />;
}

function NavigationLinkContent({
  children,
  size = 'default',
  chevron = 'right',
  chevronWeight = 'regular',
}: Pick<NavigationLinkBaseProps, 'children' | 'size' | 'chevron' | 'chevronWeight'>) {
  return (
    <>
      {chevron === 'left' ? <Chevron side="left" weight={chevronWeight} size={size} /> : null}
      {children}
      {chevron === 'right' ? <Chevron side="right" weight={chevronWeight} size={size} /> : null}
    </>
  );
}

function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}

export function NavigationLink({
  children,
  className,
  size = 'default',
  chevron = 'right',
  chevronWeight = 'regular',
  ...props
}: NavigationLinkProps) {
  const classes = cn(navigationLinkClassName(size), className);

  if ('as' in props && props.as === 'span') {
    return (
      <span className={classes}>
        <NavigationLinkContent size={size} chevron={chevron} chevronWeight={chevronWeight}>
          {children}
        </NavigationLinkContent>
      </span>
    );
  }

  if ('onPress' in props && props.onPress) {
    return (
      <button
        type={props.type ?? 'button'}
        onClick={props.onPress}
        className={cn(classes, 'cursor-pointer border-0 bg-transparent p-0 text-left')}
      >
        <NavigationLinkContent size={size} chevron={chevron} chevronWeight={chevronWeight}>
          {children}
        </NavigationLinkContent>
      </button>
    );
  }

  if ('href' in props && props.href) {
    if (isExternalHref(props.href)) {
      return (
        <a
          href={props.href}
          className={classes}
          onClick={props.onClick}
          onPointerDown={props.onPointerDown}
          {...(props.href.startsWith('http')
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          <NavigationLinkContent size={size} chevron={chevron} chevronWeight={chevronWeight}>
            {children}
          </NavigationLinkContent>
        </a>
      );
    }

    const target = props.target;
    const rel = target === '_blank' ? 'noopener noreferrer' : undefined;

    return (
      <Link
        href={props.href}
        className={classes}
        target={target}
        rel={rel}
        onClick={props.onClick}
        onPointerDown={props.onPointerDown}
      >
        <NavigationLinkContent size={size} chevron={chevron} chevronWeight={chevronWeight}>
          {children}
        </NavigationLinkContent>
      </Link>
    );
  }

  return null;
}
