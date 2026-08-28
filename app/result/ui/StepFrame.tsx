import type { ReactNode } from 'react';

interface StepFrameProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Vertically center the main area — checkout, scan, already-covered cards. */
  centerContent?: boolean;
  /** Scroll header, body, and footer together — long forms like the questionnaire. */
  scrollWithContent?: boolean;
}

/** Fills the viewport below the wizard chrome; step header stays on top, footer at bottom. */
export function StepFrame({
  header,
  children,
  footer,
  centerContent = false,
  scrollWithContent = false,
}: StepFrameProps) {
  if (scrollWithContent) {
    return (
      <div className="flex flex-col">
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
        className={`flex h-full min-h-0 flex-1 flex-col ${centerContent ? 'justify-center' : 'overflow-y-auto'}`}
      >
        {children}
      </div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
