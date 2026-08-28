'use client';

import type { GeneratedDocument } from '@/api/documents';
import { PolicyDocumentHeader, PolicyDocumentMain } from './PolicyDocument';
import { PolicyImplementationGuide } from './PolicyImplementationGuide';

interface PolicyDetailTabsProps {
  document: GeneratedDocument;
}

export function PolicyDetailTabs({ document }: PolicyDetailTabsProps) {
  return (
    <>
      <div className="border-border border-b">
        <div className="flex flex-col gap-8 px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
          <PolicyDocumentHeader document={document} />
        </div>
      </div>

      <div className="border-border flex flex-col sm:flex-row sm:items-start">
        <div className="border-border min-w-0 flex-1 border-r">
          <PolicyDocumentMain document={document} />
        </div>
        <div className="min-w-0 sm:w-[min(100%,20rem)] lg:w-96">
          <PolicyImplementationGuide document={document} />
        </div>
      </div>
    </>
  );
}
