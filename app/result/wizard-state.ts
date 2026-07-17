import type { ImprovedFormData } from './content/improved-form';

export type WizardStep = 'scan' | 'improved' | 'eu-rep' | 'summary';

export type WizardPersistedState = {
  step: WizardStep;
  scanDone: boolean;
  formData?: ImprovedFormData;
  euRepPlan?: 'budget' | 'standard' | 'premium';
  euRepSkipped: boolean;
  visitedSteps: WizardStep[];
};

const WIZARD_STORAGE_KEY = 'datenschutzpartner-result-wizard';

export const WIZARD_STEP_ORDER: WizardStep[] = ['scan', 'improved', 'eu-rep', 'summary'];

const VALID_STEPS = new Set<WizardStep>(WIZARD_STEP_ORDER);

export type WizardProgress = Pick<
  WizardPersistedState,
  'scanDone' | 'formData' | 'euRepPlan' | 'euRepSkipped'
>;

export function isWizardStep(value: string | null): value is WizardStep {
  return value !== null && VALID_STEPS.has(value as WizardStep);
}

export function maxAccessibleStep(progress: WizardProgress): WizardStep {
  if (!progress.scanDone) return 'scan';
  if (!progress.formData) return 'improved';
  if (!progress.euRepPlan && !progress.euRepSkipped) return 'eu-rep';
  return 'summary';
}

export function resolveWizardStep(
  requestedStep: WizardStep | null,
  progress: WizardProgress
): WizardStep {
  const maxStep = maxAccessibleStep(progress);
  const maxIndex = WIZARD_STEP_ORDER.indexOf(maxStep);

  if (!requestedStep) return maxStep;

  const requestedIndex = WIZARD_STEP_ORDER.indexOf(requestedStep);
  if (requestedIndex < 0) return maxStep;

  return WIZARD_STEP_ORDER[Math.min(requestedIndex, maxIndex)] ?? maxStep;
}

export function buildVisitedSteps(state: WizardProgress & { step: WizardStep }): WizardStep[] {
  const visited: WizardStep[] = ['scan'];

  if (state.scanDone) visited.push('improved');
  if (state.formData) visited.push('eu-rep');
  if (state.euRepPlan || state.euRepSkipped) visited.push('summary');

  const maxIndex = WIZARD_STEP_ORDER.indexOf(maxAccessibleStep(state));
  const stepIndex = WIZARD_STEP_ORDER.indexOf(state.step);
  if (stepIndex >= 0 && stepIndex <= maxIndex && !visited.includes(state.step)) {
    visited.push(state.step);
  }

  return visited;
}

export function readWizardState(stepFromUrl?: string | null): WizardPersistedState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as WizardPersistedState;
    if (!isWizardStep(parsed.step)) return null;

    const stepParam = stepFromUrl ?? null;
    const stepCandidate = isWizardStep(stepParam) ? stepParam : parsed.step;
    const step = resolveWizardStep(stepCandidate, parsed);

    return {
      ...parsed,
      step,
      visitedSteps: buildVisitedSteps({ ...parsed, step }),
    };
  } catch {
    return null;
  }
}

export function writeWizardState(state: WizardPersistedState) {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function buildResultReturnTo(searchParams: URLSearchParams, step: WizardStep) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('step', step);
  return `/result?${params.toString()}`;
}
