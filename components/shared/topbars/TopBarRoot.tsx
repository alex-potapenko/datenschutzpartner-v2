'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { TOPBAR_ACCENT_BG, TOPBAR_STICKY_CLASS } from './constants';
import { cn } from '@/lib/utils';

type TopBarRootProps = {
  children: ReactNode;
  /** Sticky public bar hides when the footer is visible. */
  hideOnFooterScroll?: boolean;
  sticky?: boolean;
  trackHeight?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Accent shell shared by all top bar variants. */
export function TopBarRoot({
  children,
  hideOnFooterScroll = false,
  sticky = true,
  trackHeight = true,
  className,
  style,
}: TopBarRootProps) {
  const [hidden, setHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!trackHeight) return;

    const header = headerRef.current;
    if (!header) return;

    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.contentRect.height;
      if (height) {
        document.documentElement.style.setProperty('--topbar-height', `${height}px`);
      }
    });

    observer.observe(header);

    return () => {
      observer.disconnect();
    };
  }, [trackHeight]);

  useEffect(() => {
    if (!hideOnFooterScroll) return;

    const footer = document.getElementById('site-footer');
    if (!footer) return;

    let footerVisible = false;

    const updateHidden = () => {
      setHidden(footerVisible && window.scrollY > 0);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        footerVisible = entry?.isIntersecting ?? false;
        updateHidden();
      },
      { threshold: 0 }
    );

    observer.observe(footer);
    window.addEventListener('scroll', updateHidden, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateHidden);
    };
  }, [hideOnFooterScroll]);

  return (
    <header
      ref={headerRef}
      className={cn(sticky && TOPBAR_STICKY_CLASS, 'text-white', className)}
      style={{
        backgroundColor: TOPBAR_ACCENT_BG,
        transform: hideOnFooterScroll && hidden ? 'translateY(-100%)' : 'translateY(0)',
        ...style,
      }}
    >
      {children}
    </header>
  );
}
