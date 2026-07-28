'use client';

import { useState, type Key, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui';
import type { GeneratedDocument } from '@/api/documents';
import { PolicyDocument, PolicyDocumentHeader } from './PolicyDocument';
import { PolicyImplementationGuide } from './PolicyImplementationGuide';

type PolicyDetailTab = 'policy' | 'instruction';

interface PolicyDetailTabsProps {
  document: GeneratedDocument;
  headerAction?: ReactNode;
  onExport?: () => void;
  showVersions?: boolean;
  defaultTab?: PolicyDetailTab;
}

export function PolicyDetailTabs({
  document,
  headerAction,
  onExport,
  showVersions = true,
  defaultTab = 'policy',
}: PolicyDetailTabsProps) {
  const t = useTranslations('policyDocument.tabs');
  const [tab, setTab] = useState<PolicyDetailTab>(defaultTab);

  return (
    <>
      <div className="flex flex-col gap-8 px-4 pt-20 pb-6 sm:px-8 sm:pb-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <PolicyDocumentHeader document={document} />
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      </div>

      <Tabs
        variant="secondary"
        selectedKey={tab}
        onSelectionChange={(key: Key) => {
          setTab(key as PolicyDetailTab);
        }}
        className="w-full gap-0"
      >
        <Tabs.ListContainer className="border-border overflow-x-auto border-b px-4 sm:px-8">
          <Tabs.List aria-label={t('ariaLabel')} className="!w-auto max-w-full !border-b-0">
            <Tabs.Tab id="policy" className="!h-auto !w-auto shrink-0 pb-4">
              <span className="text-base font-medium whitespace-nowrap">{t('policy')}</span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="instruction" className="!h-auto !w-auto shrink-0 pb-4">
              <span className="text-base font-medium whitespace-nowrap">{t('instruction')}</span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="policy" className="!mt-0 pb-10">
          <PolicyDocument
            document={document}
            embedInPage
            onExport={onExport}
            showVersions={showVersions}
          />
        </Tabs.Panel>

        <Tabs.Panel id="instruction" className="!mt-0 pt-8 pb-10">
          <PolicyImplementationGuide document={document} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
