import type { QuestionnaireFormData } from './content/questionnaire-form';
import { isGdprApplicable } from '@/api/generator';
import { normalizeAndValidateWebsiteUrl } from '@/lib/validation/url';
import type { EuRepPlanId } from '@/api/checkout';

export { isGdprApplicable } from '@/api/generator';
export type { EuRepPlanId } from '@/api/checkout';

export type WizardStep =
  | 'website'
  | 'scanning'
  | 'questionnaire'
  | 'eu-rep'
  | 'summary'
  | 'confirm';

/**
 * EU representation decision captured on the `eu-rep` step. Wizard purchases
 * always use Basis when the user opts into our offer.
 */
export type EuRepYesNo = 'yes' | 'no' | '';

export type EuRepState = {
  /** Buying a new representation contract with this checkout. */
  plan?: EuRepPlanId;
  /** Link the new hosted policy to this existing contract (no extra charge). */
  linkContractId?: string;
  /** Swiss legal entity for a new contract purchased in the wizard. */
  legalEntity?: string;
  /** Forwarding email for a new contract purchased in the wizard. */
  forwardingEmail?: string;
  /** Swiss postal address for a new contract purchased in the wizard. */
  postalLine1?: string;
  postalLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  /** Whether the user has named any EU representative. */
  hasNamedEuRep?: EuRepYesNo;
  /** Whether VGS Datenschutzpartner GmbH was named as representative. */
  namedDatenschutzpartner?: EuRepYesNo;
  /** Third-party representative details (when another provider was named). */
  thirdPartyRepName?: string;
  thirdPartyRepStreet?: string;
  thirdPartyRepPostalCode?: string;
  thirdPartyRepCity?: string;
  thirdPartyRepCountry?: string;
  thirdPartyRepEmail?: string;
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
  formData?: QuestionnaireFormData;
  euRep: EuRepState;
  /** Re-run the questionnaire only — skips scan (policy update flow). */
  questionnaireOnly?: boolean;
  updateDocumentId?: string;
  /** Prepaid slot on an existing policy subscription. */
  fillSubscriptionId?: string;
  /**
   * Whether the run already has a website URL (from `?url=`).
   * `false` shows the website-input step first. Omitted/`true` skips it.
   */
  hasWebsiteUrl?: boolean;
  /**
   * Guest-only Account step. Logged-in members skip it and go to the
   * confirmation screen instead. Defaults to true when omitted.
   */
  includeAccountStep?: boolean;
  /** The confirmation screen is reachable (logged-in finish or verified email). */
  confirmReady?: boolean;
};

export type WizardConfirmPhase = 'confirm' | 'ready';

export type WizardPersistedState = WizardProgress & {
  step: WizardStep;
  visitedSteps: WizardStep[];
  /** Hostname the persisted run belongs to — prevents cross-site state bleed. */
  domain?: string;
  checkoutPhase?: WizardConfirmPhase;
  checkoutDocumentId?: string;
};

export function isQuestionnaireOnlyMode(params: URLSearchParams): boolean {
  return params.get('mode') === 'update';
}

export function readFillSubscriptionId(params: URLSearchParams): string | undefined {
  const value = params.get('fillSubscription')?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function hasWebsiteUrlParam(params: URLSearchParams): boolean {
  return Boolean(params.get('url')?.trim());
}

export function normalizeWebsiteUrl(value: string): string | null {
  return normalizeAndValidateWebsiteUrl(value);
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

  // Adding a website starts a fresh run — never inherit a previous scan.
  if (!hasWebsiteUrlParam(params)) {
    return false;
  }

  // A new-site generation must never inherit a policy-update session.
  if (restored.questionnaireOnly) {
    return false;
  }

  // Resume an in-progress generation for the same site (reload or back navigation).
  return restored.domain === undefined || restored.domain === domain;
}

const WIZARD_STORAGE_KEY = 'datenschutzpartner-result-wizard';

/**
 * A running scan does not survive reload. Show the website input instead
 * (same as starting the wizard from the member profile).
 */
export function shouldResetIncompleteScan(
  requestedStep: string | null,
  scanDone: boolean,
  questionnaireOnly: boolean
): boolean {
  if (questionnaireOnly) return false;
  return normalizeWizardStep(requestedStep) === 'scanning' && !scanDone;
}

const VALID_STEPS = new Set<WizardStep>([
  'website',
  'scanning',
  'questionnaire',
  'eu-rep',
  'summary',
  'confirm',
]);

function normalizeWizardStep(value: string | null | undefined): WizardStep | null {
  if (value === 'scan') return 'scanning';
  if (value === 'checkout') return 'summary';
  if (value === 'improved') return 'questionnaire';
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

/** EU-rep step was skipped because questionnaire answers do not require it. */
export function skippedEuRepState(): EuRepState {
  return { declined: true, done: true };
}

/**
 * Whether the dedicated EU representation wizard step is shown.
 * Requires GDPR to apply (yes or unknown) and data exports outside Switzerland.
 */
export function shouldShowEuRepStep(formData?: QuestionnaireFormData): boolean {
  if (!formData) return false;

  const gdprApplies = formData.gdprApplicable === 'yes' || formData.gdprApplicable === 'dontknow';
  const exportsDataAbroad =
    formData.transfersAbroad === 'eea' || formData.transfersAbroad === 'worldwide';

  return gdprApplies && exportsDataAbroad;
}

export function showThirdPartyRepFields(
  euRep: Pick<EuRepState, 'hasNamedEuRep' | 'namedDatenschutzpartner'>
): boolean {
  return euRep.hasNamedEuRep === 'yes' && euRep.namedDatenschutzpartner === 'no';
}

export type EuRepOfferVariant = 'new' | 'switch';

export function euRepOfferVariant(
  euRep: Pick<EuRepState, 'hasNamedEuRep' | 'namedDatenschutzpartner'>
): EuRepOfferVariant | null {
  if (euRep.hasNamedEuRep === 'no') return 'new';
  if (showThirdPartyRepFields(euRep)) return 'switch';
  return null;
}

const EU_REP_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hasCompleteThirdPartyRepDetails(
  euRep: Pick<
    EuRepState,
    | 'thirdPartyRepName'
    | 'thirdPartyRepStreet'
    | 'thirdPartyRepPostalCode'
    | 'thirdPartyRepCity'
    | 'thirdPartyRepCountry'
    | 'thirdPartyRepEmail'
  >
): boolean {
  return Boolean(
    euRep.thirdPartyRepName?.trim() &&
    euRep.thirdPartyRepStreet?.trim() &&
    euRep.thirdPartyRepPostalCode?.trim() &&
    euRep.thirdPartyRepCity?.trim() &&
    euRep.thirdPartyRepCountry?.trim() &&
    EU_REP_EMAIL_PATTERN.test(euRep.thirdPartyRepEmail?.trim() ?? '')
  );
}

/** User documented an EU rep other than our subscription offer. */
export function hasDocumentedEuRepAlternative(
  euRep: Pick<
    EuRepState,
    | 'hasNamedEuRep'
    | 'namedDatenschutzpartner'
    | 'thirdPartyRepName'
    | 'thirdPartyRepStreet'
    | 'thirdPartyRepPostalCode'
    | 'thirdPartyRepCity'
    | 'thirdPartyRepCountry'
    | 'thirdPartyRepEmail'
  >
): boolean {
  if (euRep.hasNamedEuRep === 'yes' && euRep.namedDatenschutzpartner === 'yes') {
    return true;
  }
  if (showThirdPartyRepFields(euRep)) {
    return hasCompleteThirdPartyRepDetails(euRep);
  }
  return false;
}

/** Whether skipping our EU-rep offer needs an explicit liability warning. */
export function shouldConfirmEuRepSkip(
  formData: QuestionnaireFormData,
  euRep: EuRepState
): boolean {
  if (isBuyingEuRep(euRep) || isLinkingExistingEuRep(euRep)) return false;
  if (hasDocumentedEuRepAlternative(euRep)) return false;
  return isGdprApplicable(formData);
}

export function mergeEuRepIntoFormData(
  form: QuestionnaireFormData,
  euRep: EuRepState
): QuestionnaireFormData {
  const hasThirdParty = showThirdPartyRepFields(euRep);

  return {
    ...form,
    hasThirdPartyEuRep: hasThirdParty ? 'yes' : 'no',
    thirdPartyRepName: hasThirdParty ? (euRep.thirdPartyRepName ?? '').trim() : '',
    thirdPartyRepStreet: hasThirdParty ? (euRep.thirdPartyRepStreet ?? '').trim() : '',
    thirdPartyRepPostalCode: hasThirdParty ? (euRep.thirdPartyRepPostalCode ?? '').trim() : '',
    thirdPartyRepCity: hasThirdParty ? (euRep.thirdPartyRepCity ?? '').trim() : '',
    thirdPartyRepCountry: hasThirdParty ? (euRep.thirdPartyRepCountry ?? '').trim() : '',
    thirdPartyRepEmail: hasThirdParty ? (euRep.thirdPartyRepEmail ?? '').trim() : '',
  };
}

/**
 * @deprecated Swiss controllers only — kept for legacy persisted state.
 * Use {@link isGdprApplicable} for GDPR applicability.
 */
export function isEuRepApplicable(formData?: QuestionnaireFormData): boolean {
  return shouldShowEuRepStep(formData);
}

/**
 * Verdict: EU representation is likely required when GDPR applies.
 */
export function isEuRepRequired(formData?: QuestionnaireFormData): boolean {
  return isGdprApplicable(formData);
}

/** The ordered screens for the current run — Account is conditional for guests. */
export function wizardStepOrder(progress: WizardProgress): WizardStep[] {
  const steps: WizardStep[] = progress.questionnaireOnly
    ? ['questionnaire']
    : progress.hasWebsiteUrl === false
      ? ['website', 'scanning', 'questionnaire']
      : ['scanning', 'questionnaire'];
  if (shouldShowEuRepStep(progress.formData)) {
    steps.push('eu-rep');
  }
  if (!progress.questionnaireOnly) {
    if (progress.includeAccountStep !== false) steps.push('summary');
    steps.push('confirm');
  }
  return steps;
}

export function lastContentStep(progress: Pick<WizardProgress, 'formData'>): WizardStep {
  return shouldShowEuRepStep(progress.formData) ? 'eu-rep' : 'questionnaire';
}

export function maxAccessibleStep(progress: WizardProgress): WizardStep {
  if (!progress.questionnaireOnly && progress.hasWebsiteUrl === false) return 'website';
  if (!progress.questionnaireOnly && !progress.scanDone) return 'scanning';
  if (!progress.formData) return 'questionnaire';

  const euRepApplies = shouldShowEuRepStep(progress.formData);
  if (euRepApplies && !progress.euRep.done) return 'eu-rep';
  if (progress.questionnaireOnly) return 'questionnaire';

  if (progress.includeAccountStep === false || progress.confirmReady) {
    return 'confirm';
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
    postalLine1:
      typeof value.postalLine1 === 'string' && value.postalLine1.length > 0
        ? value.postalLine1
        : undefined,
    postalLine2:
      typeof value.postalLine2 === 'string' && value.postalLine2.length > 0
        ? value.postalLine2
        : undefined,
    postalCode:
      typeof value.postalCode === 'string' && value.postalCode.length > 0
        ? value.postalCode
        : undefined,
    city: typeof value.city === 'string' && value.city.length > 0 ? value.city : undefined,
    country:
      typeof value.country === 'string' && value.country.length > 0 ? value.country : undefined,
    declined: value.declined,
    done: value.done,
    hasNamedEuRep:
      value.hasNamedEuRep === 'yes' || value.hasNamedEuRep === 'no'
        ? value.hasNamedEuRep
        : undefined,
    namedDatenschutzpartner:
      value.namedDatenschutzpartner === 'yes' || value.namedDatenschutzpartner === 'no'
        ? value.namedDatenschutzpartner
        : undefined,
    thirdPartyRepName:
      typeof value.thirdPartyRepName === 'string' && value.thirdPartyRepName.length > 0
        ? value.thirdPartyRepName
        : undefined,
    thirdPartyRepStreet:
      typeof value.thirdPartyRepStreet === 'string' && value.thirdPartyRepStreet.length > 0
        ? value.thirdPartyRepStreet
        : undefined,
    thirdPartyRepPostalCode:
      typeof value.thirdPartyRepPostalCode === 'string' && value.thirdPartyRepPostalCode.length > 0
        ? value.thirdPartyRepPostalCode
        : undefined,
    thirdPartyRepCity:
      typeof value.thirdPartyRepCity === 'string' && value.thirdPartyRepCity.length > 0
        ? value.thirdPartyRepCity
        : undefined,
    thirdPartyRepCountry:
      typeof value.thirdPartyRepCountry === 'string' && value.thirdPartyRepCountry.length > 0
        ? value.thirdPartyRepCountry
        : undefined,
    thirdPartyRepEmail:
      typeof value.thirdPartyRepEmail === 'string' && value.thirdPartyRepEmail.length > 0
        ? value.thirdPartyRepEmail
        : undefined,
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

    const legacyCheckoutPhase = parsed.checkoutPhase as string | undefined;
    const confirmReady =
      Boolean(parsed.confirmReady) ||
      legacyCheckoutPhase === 'confirm' ||
      migratedStep === 'confirm';

    const progress: WizardProgress = {
      scanDone: Boolean(parsed.scanDone),
      formData: parsed.formData,
      euRep: migrateEuRep(parsed.euRep),
      questionnaireOnly: Boolean(parsed.questionnaireOnly),
      updateDocumentId: parsed.updateDocumentId,
      fillSubscriptionId: parsed.fillSubscriptionId,
      includeAccountStep: parsed.includeAccountStep,
      confirmReady,
    };

    const stepParam = normalizeWizardStep(stepFromUrl ?? null);
    const stepCandidate = stepParam ?? migratedStep;
    let step = resolveWizardStep(stepCandidate, progress);
    if (legacyCheckoutPhase === 'payment' && !progress.questionnaireOnly) {
      step = 'summary';
    }
    if (legacyCheckoutPhase === 'confirm' && !progress.questionnaireOnly) {
      step = 'confirm';
    }

    return {
      ...progress,
      domain: parsed.domain,
      step,
      visitedSteps: buildVisitedSteps({ ...progress, step }),
      checkoutPhase:
        legacyCheckoutPhase === 'ready' || legacyCheckoutPhase === 'confirm'
          ? legacyCheckoutPhase
          : undefined,
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

function hasEuRepUserProgress(euRep: EuRepState): boolean {
  return Boolean(
    euRep.done ||
    euRep.declined ||
    euRep.linkContractId ||
    euRep.plan ||
    euRep.hasNamedEuRep ||
    euRep.namedDatenschutzpartner ||
    euRep.legalEntity?.trim() ||
    euRep.forwardingEmail?.trim() ||
    euRep.thirdPartyRepName?.trim() ||
    euRep.thirdPartyRepStreet?.trim() ||
    euRep.thirdPartyRepPostalCode?.trim() ||
    euRep.thirdPartyRepCity?.trim() ||
    euRep.thirdPartyRepCountry?.trim() ||
    euRep.thirdPartyRepEmail?.trim()
  );
}

/** Whether the user has entered or answered anything worth confirming on quit. */
export function hasWizardUserProgress(progress: WizardProgress): boolean {
  if (progress.confirmReady) return true;

  if (progress.questionnaireOnly) {
    return progress.formData !== undefined || hasEuRepUserProgress(progress.euRep);
  }

  if (progress.scanDone) return true;
  if (progress.formData !== undefined) return true;
  if (hasEuRepUserProgress(progress.euRep)) return true;

  return false;
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
    step: 'questionnaire',
  });
  return `/result?${params.toString()}`;
}
