'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MagnifyingGlass } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { ScanForm } from '@/components/shared/ScanForm';
import { SCAN_PHASE_MS } from '../content/scan-groups';
import { StepFrame } from '../ui/StepFrame';

interface ScanStepProps {
  domain: string;
  onContinue: () => void;
  skipLoading?: boolean;
}

export function ScanStep({ domain, onContinue, skipLoading }: ScanStepProps) {
  const t = useTranslations('result.scanStep');
  const onContinueRef = useRef(onContinue);
  const hasContinuedRef = useRef(false);

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    hasContinuedRef.current = false;
  }, [domain]);

  useEffect(() => {
    if (skipLoading) {
      if (hasContinuedRef.current) return;
      hasContinuedRef.current = true;
      onContinueRef.current();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (hasContinuedRef.current) return;
      hasContinuedRef.current = true;
      onContinueRef.current();
    }, SCAN_PHASE_MS * 2);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [domain, skipLoading]);

  if (skipLoading) {
    return (
      <StepFrame centerContent>
        <div className="flex flex-1" />
      </StepFrame>
    );
  }

  return (
    <StepFrame centerContent>
      <Container className="flex h-full flex-1 flex-col">
        <div className="border-border relative flex h-full flex-1 items-center justify-center overflow-x-hidden border-r border-l px-4 py-16 sm:px-8 sm:py-24">
          <ScanForm
            scanning
            scanningLabel={t('scanningWebsite')}
            scanningIcon={MagnifyingGlass}
            displayValue={domain}
          />
        </div>
      </Container>
    </StepFrame>
  );
}
