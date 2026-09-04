'use client';

import { useEffect, useState } from 'react';
import { SCAN_PHASE_MS } from './scan-groups';

export type ScanLoadingPhase = 'scanning' | 'creating';

export function useScanLoadingPhase(active: boolean): ScanLoadingPhase {
  const [phase, setPhase] = useState<ScanLoadingPhase>('scanning');

  useEffect(() => {
    if (!active) {
      setPhase('scanning');
      return;
    }

    setPhase('scanning');
    const timeoutId = window.setTimeout(() => {
      setPhase('creating');
    }, SCAN_PHASE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [active]);

  return phase;
}
