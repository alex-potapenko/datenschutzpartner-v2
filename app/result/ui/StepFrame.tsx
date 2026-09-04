'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface StepFrameProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Vertically center the main area — checkout, scan, already-covered cards. */
  centerContent?: boolean;
  /** Scroll header and body with the wizard chrome; footer is pinned to the viewport bottom. */
  scrollWithContent?: boolean;
  /** Allow glows and shadows to extend outside the step body (checkout plan card). */
  contentOverflowVisible?: boolean;
}

/** Fills the viewport below the wizard chrome; step header stays on top, footer at bottom. */
export function StepFrame({
  header,
  children,
  footer,
  centerContent = false,
  scrollWithContent = false,
  contentOverflowVisible = false,
}: StepFrameProps) {
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollWithContent) return;
    bodyScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [scrollWithContent]);

  if (scrollWithContent) {
    return (
      <div className="flex flex-1 flex-col">
        {header}
        {children}
        {footer}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {header ? <div className="shrink-0">{header}</div> : null}
      <div
        ref={bodyScrollRef}
        className={`flex h-full min-h-0 flex-1 flex-col ${centerContent ? 'justify-center' : contentOverflowVisible ? 'overflow-visible' : 'overflow-y-auto'}`}
      >
        {children}
      </div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
