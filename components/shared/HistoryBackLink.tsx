'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type HistoryBackLinkProps = {
  fallbackHref: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/** Navigates to the previous in-app page when possible, otherwise to `fallbackHref`. */
export function HistoryBackLink({
  fallbackHref,
  label,
  className,
  style,
  children,
}: HistoryBackLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={fallbackHref}
      aria-label={label}
      style={style}
      onClick={(event) => {
        event.preventDefault();

        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      }}
      className={className}
    >
      {children ?? label}
    </Link>
  );
}
