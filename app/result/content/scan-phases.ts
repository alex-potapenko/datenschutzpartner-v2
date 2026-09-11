import { Crosshair, Database, Globe, MagnifyingGlass } from '@/components/ui';

export const SCAN_PHASE_MS = 4000;
export const SCAN_PHASE_COUNT = 4;
export const SCAN_PHASE_DURATIONS_MS = [2000, 4000, 4000, 4000] as const;
export const SCAN_DURATION_MS = SCAN_PHASE_DURATIONS_MS.reduce((total, ms) => total + ms, 0);

export function scanPhaseCompletionDelayMs(completedPhaseCount: number): number {
  return SCAN_PHASE_DURATIONS_MS.slice(0, completedPhaseCount).reduce((total, ms) => total + ms, 0);
}

export const SCAN_PHASE_IDS = ['connecting', 'discovering', 'detecting', 'mapping'] as const;

export type ScanPhaseId = (typeof SCAN_PHASE_IDS)[number];

type ScanPhaseIcon = typeof Globe;

export type ScanPhaseDefinition = {
  id: ScanPhaseId;
  messageKey: `phases.${ScanPhaseId}`;
  icon: ScanPhaseIcon;
};

export const SCAN_PHASES: ScanPhaseDefinition[] = [
  { id: 'connecting', messageKey: 'phases.connecting', icon: Globe },
  { id: 'discovering', messageKey: 'phases.discovering', icon: MagnifyingGlass },
  { id: 'detecting', messageKey: 'phases.detecting', icon: Crosshair },
  { id: 'mapping', messageKey: 'phases.mapping', icon: Database },
];
