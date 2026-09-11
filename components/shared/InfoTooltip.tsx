'use client';

import { useState, type ReactNode } from 'react';
import { Info, Tooltip } from '@/components/ui';

/** Info icon that reveals supporting copy on hover — keeps section headers free of lead paragraphs. */
export function InfoTooltip({
  label,
  children,
  contentClassName = 'max-w-xs p-3 text-sm leading-relaxed break-normal',
}: {
  label: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip delay={0} closeDelay={0} isOpen={isOpen} onOpenChange={setIsOpen}>
      <Tooltip.Trigger
        aria-label={label}
        className="text-accent hover:text-key-700 inline-flex shrink-0 cursor-pointer items-center justify-center"
        onPointerEnter={() => {
          setIsOpen(true);
        }}
        onPointerLeave={() => {
          setIsOpen(false);
        }}
      >
        <Info size={16} weight="bold" aria-hidden />
      </Tooltip.Trigger>
      <Tooltip.Content className={contentClassName}>{children}</Tooltip.Content>
    </Tooltip>
  );
}
