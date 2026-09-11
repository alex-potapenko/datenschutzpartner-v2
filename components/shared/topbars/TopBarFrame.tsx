import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TOPBAR_BORDER_CLASS, TOPBAR_ROW_PADDING } from './constants';
import type { TopBarFrameLayout } from './types';

const FRAME_CLASS: Record<TopBarFrameLayout, string> = {
  row: cn(TOPBAR_BORDER_CLASS, TOPBAR_ROW_PADDING, 'flex items-center lg:px-8'),
  account: cn(TOPBAR_BORDER_CLASS, 'flex items-stretch'),
  'public-grid': cn(
    TOPBAR_BORDER_CLASS,
    TOPBAR_ROW_PADDING,
    'grid grid-cols-[1fr_auto] items-center sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-8'
  ),
  'wizard-split': cn(TOPBAR_BORDER_CLASS, 'flex items-center'),
  'drawer-header': cn(
    TOPBAR_BORDER_CLASS,
    TOPBAR_ROW_PADDING,
    'grid grid-cols-[1fr_auto] items-center sm:px-8'
  ),
};

export function TopBarFrame({
  layout,
  className,
  children,
}: {
  layout: TopBarFrameLayout;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(FRAME_CLASS[layout], className)}>{children}</div>;
}
