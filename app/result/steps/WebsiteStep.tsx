'use client';

import { useLayoutEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/shared/Container';
import { ScanForm } from '@/components/shared/ScanForm';
import { StepFrame } from '../ui/StepFrame';
import { consumePendingScanUrl } from '@/lib/pending-scan-url';
import { clearWizardState, normalizeWebsiteUrl, readFillSubscriptionId } from '../wizard-state';

export function WebsiteStep({
  onUrlSubmit,
  onUrlChange,
  autoFocus = false,
}: {
  onUrlSubmit: (url: string) => void;
  onUrlChange?: (url: string) => void;
  autoFocus?: boolean;
}) {
  const searchParams = useSearchParams();
  const fillSubscriptionId = readFillSubscriptionId(searchParams);

  useLayoutEffect(() => {
    clearWizardState();
    const pending = consumePendingScanUrl();
    const normalized = pending ? normalizeWebsiteUrl(pending) : null;
    if (normalized) onUrlSubmit(normalized);
    // Pending URL is consumed once on mount — parent navigates to the scanning step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StepFrame centerContent>
      <Container className="flex h-full flex-1 flex-col">
        <div className="border-border relative flex h-full flex-1 items-center justify-center border-r border-l px-4 py-10 sm:px-8">
          <ScanForm
            className="w-[480px] max-w-full"
            fillSubscriptionId={fillSubscriptionId}
            autoFocus={autoFocus}
            onUrlChange={onUrlChange}
            onSubmitUrl={(url) => {
              const normalized = normalizeWebsiteUrl(url);
              if (normalized) onUrlSubmit(normalized);
            }}
          />
        </div>
      </Container>
    </StepFrame>
  );
}
