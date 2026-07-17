'use client';

import type { ReactNode } from 'react';
import { GraduationCap, Newspaper, Tabs, cn } from '@/components/ui';
import {
  ACADEMY_PAST_SESSION_TAB_IDS,
  type AcademyPastSessionTab,
} from '@/lib/academy-content/constants';

const TAB_ICONS: Partial<Record<AcademyPastSessionTab, ReactNode>> = {
  webinars: <GraduationCap size={20} weight="fill" aria-hidden />,
  newsQuestions: <Newspaper size={20} weight="fill" aria-hidden />,
};

type AcademySessionCategoryTabsProps = {
  activeTab: AcademyPastSessionTab;
  onTabChange: (tab: AcademyPastSessionTab) => void;
  tabsNavigationLabel: string;
  tabLabels: Record<AcademyPastSessionTab, string>;
  listContainerClassName?: string;
  variant?: 'primary' | 'secondary';
  trailing?: ReactNode;
  children: ReactNode;
};

export function AcademySessionCategoryTabs({
  activeTab,
  onTabChange,
  tabsNavigationLabel,
  tabLabels,
  listContainerClassName,
  variant = 'secondary',
  trailing,
  children,
}: AcademySessionCategoryTabsProps) {
  const isPrimary = variant === 'primary';

  return (
    <Tabs
      variant={variant}
      selectedKey={activeTab}
      onSelectionChange={(key) => {
        onTabChange(key as AcademyPastSessionTab);
      }}
      className="w-full gap-0"
    >
      <Tabs.ListContainer
        className={cn(
          'overflow-x-auto',
          trailing && 'flex flex-wrap items-center justify-between gap-4',
          isPrimary ? 'p-1' : 'border-border border-b px-4 sm:px-8',
          listContainerClassName
        )}
      >
        <Tabs.List
          aria-label={tabsNavigationLabel}
          className={cn('!w-auto max-w-full !border-b-0', trailing && 'min-w-0 flex-1')}
        >
          {ACADEMY_PAST_SESSION_TAB_IDS.map((tab) => (
            <Tabs.Tab
              key={tab}
              id={tab}
              className={cn('!h-auto !w-auto shrink-0', isPrimary ? '!px-3 !py-1.5' : 'pb-4')}
            >
              <span className="inline-flex items-center gap-2 text-base font-medium whitespace-nowrap">
                {TAB_ICONS[tab]}
                {tabLabels[tab]}
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </Tabs.ListContainer>

      {children}
    </Tabs>
  );
}

export { ACADEMY_PAST_SESSION_TAB_IDS };
