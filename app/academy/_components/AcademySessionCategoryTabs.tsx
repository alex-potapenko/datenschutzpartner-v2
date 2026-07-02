'use client';

import type { ReactNode } from 'react';
import { GraduationCap, Newspaper, Tabs } from '@/components/ui';
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
  children: ReactNode;
};

export function AcademySessionCategoryTabs({
  activeTab,
  onTabChange,
  tabsNavigationLabel,
  tabLabels,
  children,
}: AcademySessionCategoryTabsProps) {
  return (
    <Tabs
      variant="secondary"
      selectedKey={activeTab}
      onSelectionChange={(key) => {
        onTabChange(key as AcademyPastSessionTab);
      }}
      className="w-full gap-0"
    >
      <Tabs.ListContainer className="border-border overflow-x-auto border-b px-4 sm:px-8">
        <Tabs.List aria-label={tabsNavigationLabel} className="!w-auto max-w-full !border-b-0">
          {ACADEMY_PAST_SESSION_TAB_IDS.map((tab) => (
            <Tabs.Tab key={tab} id={tab} className="!h-auto !w-auto shrink-0 pb-4">
              <span className="font-display inline-flex items-center gap-2 text-sm whitespace-nowrap sm:text-base">
                {TAB_ICONS[tab]}
                {tabLabels[tab]}
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>

      {children}
    </Tabs>
  );
}

export { ACADEMY_PAST_SESSION_TAB_IDS };
