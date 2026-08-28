import type { ImprovedFormData } from './content/improved-form';
import { isGdprApplicable } from '@/api/generator';

export { isGdprApplicable } from '@/api/generator';

export type WizardStep = 'scanning' | 'improved' | 'eu-rep' | 'summary';

export type EuRepPlanId = 'budget' | 'standard' | 'premium';

/**
 * EU representation decision captured on the conditional `eu-rep` step. The step
 * only appears when {@link shouldShowEuRepStep} is true (GDPR applies and the
 * user has no third-party representative). Otherwise the step is skipped after
 * the questionnaire.
 */
export type EuRepState = {
  /** Buying a new representation contract with this checkout. */
  plan?: EuRepPlanId;
  /** Link the new hosted policy to this existing contract (no extra charge). */
  linkContractId?: string;
  /** Swiss legal entity for a new contract purchased in the wizard. */
  legalEntity?: string;
  /** Forwarding email for a new contract purchased in the wizard. */
  forwardingEmail?: string;
  /** They declined to add EU representation. */
  declined?: boolean;
  /** The step was completed and checkout may be reached. */
  done?: boolean;
};

export function isBuyingEuRep(euRep: EuRepState): boolean {
  return Boolean(euRep.plan) && !euRep.linkContractId;
}

export function isLinkingExistingEuRep(euRep: EuRepState): boolean {
  return Boolean(euRep.linkContractId);
}

export type WizardProgress = {
  scanDone: boolean;
  formData?: ImprovedFormData;
  euRep: EuRepState;
  /** Re-run the questionnaire only — skips scan (policy update flow). */
  questionnaireOnly?: boolean;
  updateDocumentId?: string;
  /** Prepaid slot on an existing policy subscription. */
  fillSubscriptionId?: string;
};

export type WizardPersistedState = WizardProgress & {
  step: WizardStep;
  visitedSteps: WizardStep[];
  /** Hostname the persisted run belongs to — prevents cross-site state bleed. */
  domain?: string;
  checkoutPhase?: 'ready';
  checkoutDocumentId?: string;
};

export function isQuestionnaireOnlyMode(params: URLSearchParams): boolean {
  return params.get('mode') === 'update';
}

export function readFillSubscriptionId(params: URLSearchParams): string | undefined {
  const value = params.get('fillSubscription')?.trim();
  return value && value.length > 0 ? value : undefined;
}

/** Whether sessionStorage wizard progress matches the current URL run. */
export function shouldRestoreWizardState(
  restored: WizardPersistedState,
  params: URLSearchParams,
  domain: string
): boolean {
  const isUpdateFlow = isQuestionnaireOnlyMode(params);

  if (isUpdateFlow) {
    return true;
  }

  // A new-site generation must never inherit a policy-update session.
  if (restored.questionnaireOnly) {
    return false;
  }

  // Resume an in-progress generation for the same site (reload or back navigation).
  return restored.domain === undefined || restored.domain === domain;
}

const WIZARD_STORAGE_KEY = 'datenschutzpartner-result-wizard';

const VALID_STEPS = new Set<WizardStep>(['scanning', 'improved', 'eu-rep', 'summary']);

function normalizeWizardStep(value: string | null | undefined): WizardStep | null {
  if (value === 'scan') return 'scanning';
  if (value === 'checkout') return 'summary';
  if (!value || !isWizardStep(value)) return null;
  return value;
}

export function normalizeWizardStepId(value: string | null | undefined): WizardStep | null {
  return normalizeWizardStep(value);
}

export function isWizardStep(value: string | null): value is WizardStep {
  return value !== null && VALID_STEPS.has(value as WizardStep);
}

export function emptyEuRepState(): EuRepState {
  return {};
}

/**
 * Whether the EU representation wizard step should appear.
 * Skipped when GDPR does not apply or the user has a third-party representative.
 */
export function shouldShowEuRepStep(formData?: ImprovedFormData): boolean {
  if (!isGdprApplicable(formData)) return false;
  return formData?.hasThirdPartyEuRep !== 'yes';
}

/**
 * @deprecated Swiss controllers only — kept for legacy persisted state.
 * Use {@link isGdprApplicable} for GDPR applicability.
 */
export function isEuRepApplicable(formData?: ImprovedFormData): boolean {
  return shouldShowEuRepStep(formData);
}

/**
 * Verdict: EU representation is likely required when GDPR applies.
 */
export function isEuRepRequired(formData?: ImprovedFormData): boolean {
  return isGdprApplicable(formData);
}

/** The ordered steps for the current run — `eu-rep` is conditional. */
export function wizardStepOrder(progress: WizardProgress): WizardStep[] {
  const steps: WizardStep[] = progress.questionnaireOnly ? ['improved'] : ['scanning', 'improved'];
  if (shouldShowEuRepStep(progress.formData)) steps.push('eu-rep');
  if (!progress.questionnaireOnly) steps.push('summary');
  return steps;
}

export function maxAccessibleStep(progress: WizardProgress): WizardStep {
  if (!progress.questionnaireOnly && !progress.scanDone) return 'scanning';
  if (!progress.formData) return 'improved';
  if (shouldShowEuRepStep(progress.formData) && !progress.euRep.done) return 'eu-rep';
  if (progress.questionnaireOnly) {
    return shouldShowEuRepStep(progress.formData) ? 'eu-rep' : 'improved';
  }
  return 'summary';
}

export function resolveWizardStep(
  requestedStep: string | null,
  progress: WizardProgress
): WizardStep {
  const order = wizardStepOrder(progress);
  const maxStep = maxAccessibleStep(progress);
  const maxIndex = order.indexOf(maxStep);

  const requested = normalizeWizardStep(requestedStep);

  if (!requested) return maxStep;

  // Scanning is one-way — once completed, it cannot be revisited.
  if (requested === 'scanning' && progress.scanDone && !progress.questionnaireOnly) {
    return maxStep;
  }

  const requestedIndex = order.indexOf(requested);
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
  const value = raw as EuRepState;
  return {
    plan: value.plan,
    linkContractId:
      typeof value.linkContractId === 'string' && value.linkContractId.length > 0
        ? value.linkContractId
        : undefined,
    legalEntity:
      typeof value.legalEntity === 'string' && value.legalEntity.length > 0
        ? value.legalEntity
        : undefined,
    forwardingEmail:
      typeof value.forwardingEmail === 'string' && value.forwardingEmail.length > 0
        ? value.forwardingEmail
        : undefined,
    declined: value.declined,
    done: value.done,
  };
}

export function readWizardState(stepFromUrl?: string | null): WizardPersistedState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<WizardPersistedState> & { step?: string };
    const migratedStep = normalizeWizardStep(parsed.step ?? null);
    if (!migratedStep) return null;

    const progress: WizardProgress = {
      scanDone: Boolean(parsed.scanDone),
      formData: parsed.formData,
      euRep: migrateEuRep(parsed.euRep),
      questionnaireOnly: Boolean(parsed.questionnaireOnly),
      updateDocumentId: parsed.updateDocumentId,
      fillSubscriptionId: parsed.fillSubscriptionId,
    };

    const stepParam = normalizeWizardStep(stepFromUrl ?? null);
    const stepCandidate = stepParam ?? migratedStep;
    let step = resolveWizardStep(stepCandidate, progress);
    const legacyCheckoutPhase = parsed.checkoutPhase as string | undefined;
    if (legacyCheckoutPhase === 'payment' && !progress.questionnaireOnly) {
      step = 'summary';
    }

    return {
      ...progress,
      domain: parsed.domain,
      step,
      visitedSteps: buildVisitedSteps({ ...progress, step }),
      checkoutPhase: legacyCheckoutPhase === 'ready' ? 'ready' : undefined,
      checkoutDocumentId: parsed.checkoutDocumentId,
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
