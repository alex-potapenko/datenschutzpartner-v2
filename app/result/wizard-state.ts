import type { ImprovedFormData } from './content/improved-form';

export type WizardStep = 'scan' | 'improved' | 'eu-rep' | 'summary';

export type EuRepPlanId = 'budget' | 'standard' | 'premium';

/**
 * EU representation decision captured on the conditional `eu-rep` step. The step
 * only appears when {@link isEuRepApplicable} is true (the controller is based
 * outside the EEA). The step shows a verdict (representative required vs.
 * optional) plus the representation offer.
 */
export type EuRepState = {
  /** Chosen representation plan. */
  plan?: EuRepPlanId;
  /** They declined to add EU representation. */
  declined?: boolean;
  /** The step was completed and summary may be reached. */
  done?: boolean;
};

export type WizardProgress = {
  scanDone: boolean;
  formData?: ImprovedFormData;
  euRep: EuRepState;
  /** Re-run the questionnaire only — skips scan (policy update flow). */
  questionnaireOnly?: boolean;
  updateDocumentId?: string;
};

export type WizardPersistedState = WizardProgress & {
  step: WizardStep;
  visitedSteps: WizardStep[];
  checkoutPhase?: 'payment' | 'ready';
  checkoutDocumentId?: string;
};

export function isQuestionnaireOnlyMode(params: URLSearchParams): boolean {
  return params.get('mode') === 'update';
}

const WIZARD_STORAGE_KEY = 'datenschutzpartner-result-wizard';

const VALID_STEPS = new Set<WizardStep>(['scan', 'improved', 'eu-rep', 'summary']);

export function isWizardStep(value: string | null): value is WizardStep {
  return value !== null && VALID_STEPS.has(value as WizardStep);
}

export function emptyEuRepState(): EuRepState {
  return {};
}

/**
 * Q1 of the EU representation check: the step is only relevant when the
 * controller is based outside the EEA (e.g. Switzerland). Controllers within
 * the EEA never need an Article 27 representative.
 */
export function isEuRepApplicable(formData?: ImprovedFormData): boolean {
  if (!formData) return false;
  return formData.basedInSwitzerland === 'yes';
}

/**
 * Verdict: EU representation is required when the controller is outside the
 * EEA (Q1) AND either offers goods/services to (Q2) or monitors the behaviour
 * of (Q3) people in the EEA. Otherwise representation is optional.
 */
export function isEuRepRequired(formData?: ImprovedFormData): boolean {
  if (!isEuRepApplicable(formData)) return false;
  return formData?.offersToEU === 'yes' || formData?.monitorsEUBehaviour === 'yes';
}

/** The ordered steps for the current run — `eu-rep` is conditional. */
export function wizardStepOrder(progress: WizardProgress): WizardStep[] {
  const steps: WizardStep[] = progress.questionnaireOnly ? ['improved'] : ['scan', 'improved'];
  if (isEuRepApplicable(progress.formData)) steps.push('eu-rep');
  steps.push('summary');
  return steps;
}

export function maxAccessibleStep(progress: WizardProgress): WizardStep {
  if (!progress.questionnaireOnly && !progress.scanDone) return 'scan';
  if (!progress.formData) return 'improved';
  if (isEuRepApplicable(progress.formData) && !progress.euRep.done) return 'eu-rep';
  return 'summary';
}

export function resolveWizardStep(
  requestedStep: WizardStep | null,
  progress: WizardProgress
): WizardStep {
  const order = wizardStepOrder(progress);
  const maxStep = maxAccessibleStep(progress);
  const maxIndex = order.indexOf(maxStep);

  if (!requestedStep) return maxStep;

  // Scan is one-way — once completed, it cannot be revisited.
  if (requestedStep === 'scan' && progress.scanDone && !progress.questionnaireOnly) {
    return maxStep;
  }

  const requestedIndex = order.indexOf(requestedStep);
  // Requested step is not part of the current flow (e.g. eu-rep when it does
  // not apply) — fall back to the furthest reachable step.
  if (requestedIndex < 0) return maxStep;

  return order[Math.min(requestedIndex, maxIndex)] ?? maxStep;
}

export function buildVisitedSteps(state: WizardProgress & { step: WizardStep }): WizardStep[] {
  const order = wizardStepOrder(state);
  const maxIndex = order.indexOf(maxAccessibleStep(state));
  const stepIndex = Math.max(0, order.indexOf(state.step));
  const upTo = Math.max(maxIndex, stepIndex);
  return order.slice(0, upTo + 1);
}

function migrateEuRep(raw: unknown): EuRepState {
  if (!raw || typeof raw !== 'object') return {};
  return raw;
}

export function readWizardState(stepFromUrl?: string | null): WizardPersistedState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<WizardPersistedState> & { step?: string };
    if (!isWizardStep(parsed.step ?? null)) return null;

    const progress: WizardProgress = {
      scanDone: Boolean(parsed.scanDone),
      formData: parsed.formData,
      euRep: migrateEuRep(parsed.euRep),
      questionnaireOnly: Boolean(parsed.questionnaireOnly),
      updateDocumentId: parsed.updateDocumentId,
    };

    const stepParam = stepFromUrl ?? null;
    const stepCandidate = isWizardStep(stepParam) ? stepParam : (parsed.step as WizardStep);
    const step = resolveWizardStep(stepCandidate, progress);

    return {
      ...progress,
      step,
      visitedSteps: buildVisitedSteps({ ...progress, step }),
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

export function clearWizardState() {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch {
    /* quota / private mode — ignore */
  }
}

export function buildResultReturnTo(searchParams: URLSearchParams, step: WizardStep) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('step', step);
  return `/result?${params.toString()}`;
}

export function buildPolicyUpdateUrl(documentId: string, site: string): string {
  const params = new URLSearchParams({
    url: site.startsWith('http') ? site : `https://${site}`,
    mode: 'update',
    documentId,
    step: 'improved',
  });
  return `/result?${params.toString()}`;
}
