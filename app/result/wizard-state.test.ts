import { describe, expect, it } from 'vitest';
import type { QuestionnaireFormData } from './content/questionnaire-form';
import {
  emptyEuRepState,
  isBuyingEuRep,
  isLinkingExistingEuRep,
  normalizeWizardStepId,
  shouldRestoreWizardState,
  shouldShowEuRepStep,
  wizardStepOrder,
  type WizardPersistedState,
} from './wizard-state';

function form(overrides: Partial<QuestionnaireFormData> = {}): QuestionnaireFormData {
  return {
    companyName: 'Acme AG',
    domain: 'acme.ch',
    email: 'info@acme.ch',
    street: 'Bahnhofstrasse 1',
    streetLine2: '',
    postalCode: '8001',
    city: 'Zürich',
    country: 'Schweiz',
    hasDpo: 'no',
    dpoCompanyName: '',
    dpoDesignation: '',
    dpoStreet: '',
    dpoPostalCode: '',
    dpoCity: '',
    dpoCountry: '',
    dpoEmail: '',
    gdprApplicable: 'yes',
    offersToEU: '',
    monitorsEUBehaviour: '',
    transfersAbroad: 'no',
    usesProfiling: 'no',
    processesSpecialData: 'no',
    specialDataCategories: [],
    usesAiProcessing: 'no',
    acceptsApplications: 'no',
    hasTalentPool: '',
    usesVideoSurveillance: 'no',
    videoRetention: '',
    videoRetentionAmount: '',
    videoRetentionUnit: '',
    hasThirdPartyEuRep: 'no',
    thirdPartyRepName: '',
    thirdPartyRepStreet: '',
    thirdPartyRepPostalCode: '',
    thirdPartyRepCity: '',
    thirdPartyRepCountry: '',
    thirdPartyRepEmail: '',
    basedInSwitzerland: 'yes',
    ...overrides,
  };
}

function persisted(overrides: Partial<WizardPersistedState>): WizardPersistedState {
  return {
    step: 'questionnaire',
    scanDone: true,
    euRep: emptyEuRepState(),
    visitedSteps: ['questionnaire'],
    ...overrides,
  };
}

describe('isBuyingEuRep / isLinkingExistingEuRep', () => {
  it('treats a chosen plan as a new purchase', () => {
    const euRep = { plan: 'basis' as const, done: true };
    expect(isBuyingEuRep(euRep)).toBe(true);
    expect(isLinkingExistingEuRep(euRep)).toBe(false);
  });

  it('treats linkContractId as linking an existing contract', () => {
    const euRep = { linkContractId: '2', done: true };
    expect(isBuyingEuRep(euRep)).toBe(false);
    expect(isLinkingExistingEuRep(euRep)).toBe(true);
  });
});

describe('normalizeWizardStepId', () => {
  it('migrates legacy scan and checkout step ids', () => {
    expect(normalizeWizardStepId('scan')).toBe('scanning');
    expect(normalizeWizardStepId('checkout')).toBe('summary');
    expect(normalizeWizardStepId('summary')).toBe('summary');
    expect(normalizeWizardStepId('improved')).toBe('questionnaire');
  });
});

describe('wizardStepOrder', () => {
  it('omits summary in questionnaire-only update runs', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        questionnaireOnly: true,
        euRep: emptyEuRepState(),
      })
    ).toEqual(['questionnaire']);
  });

  it('ends with confirmation after the guest Account step', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        euRep: emptyEuRepState(),
        formData: form({ gdprApplicable: 'no' }),
      })
    ).toEqual(['scanning', 'questionnaire', 'summary', 'confirm']);
  });

  it('includes eu-rep when GDPR applies and no third-party representative', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        euRep: emptyEuRepState(),
        formData: form({ gdprApplicable: 'yes', hasThirdPartyEuRep: 'no' }),
      })
    ).toEqual(['scanning', 'questionnaire', 'eu-rep', 'summary', 'confirm']);
  });

  it('skips eu-rep when user has a third-party representative', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        euRep: emptyEuRepState(),
        formData: form({ gdprApplicable: 'yes', hasThirdPartyEuRep: 'yes' }),
      })
    ).toEqual(['scanning', 'questionnaire', 'summary', 'confirm']);
  });

  it('omits the Account step for logged-in members and ends with confirmation', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        euRep: emptyEuRepState(),
        formData: form({ gdprApplicable: 'no' }),
        includeAccountStep: false,
      })
    ).toEqual(['scanning', 'questionnaire', 'confirm']);
  });
});

describe('shouldShowEuRepStep', () => {
  it('is false when GDPR does not apply', () => {
    expect(shouldShowEuRepStep(form({ gdprApplicable: 'no' }))).toBe(false);
  });

  it('is false when a third-party representative was declared', () => {
    expect(shouldShowEuRepStep(form({ gdprApplicable: 'yes', hasThirdPartyEuRep: 'yes' }))).toBe(
      false
    );
  });

  it('is true when GDPR applies and no third-party representative', () => {
    expect(shouldShowEuRepStep(form({ gdprApplicable: 'yes', hasThirdPartyEuRep: 'no' }))).toBe(
      true
    );
  });
});

describe('shouldRestoreWizardState', () => {
  it('restores policy update sessions when URL is in update mode', () => {
    const restored = persisted({ questionnaireOnly: true, updateDocumentId: '1' });
    const params = new URLSearchParams({
      url: 'https://example.com',
      mode: 'update',
      documentId: '1',
    });

    expect(shouldRestoreWizardState(restored, params, 'example.com')).toBe(true);
  });

  it('does not restore update sessions for a new-site generation URL', () => {
    const restored = persisted({
      questionnaireOnly: true,
      updateDocumentId: '1',
      domain: 'old-site.ch',
    });
    const params = new URLSearchParams({ url: 'https://new-site.ch' });

    expect(shouldRestoreWizardState(restored, params, 'new-site.ch')).toBe(false);
  });

  it('restores generation progress for the same domain', () => {
    const restored = persisted({ domain: 'my-site.ch', scanDone: false });
    const params = new URLSearchParams({ url: 'https://my-site.ch' });

    expect(shouldRestoreWizardState(restored, params, 'my-site.ch')).toBe(true);
  });

  it('does not restore generation progress for a different domain', () => {
    const restored = persisted({ domain: 'old-site.ch' });
    const params = new URLSearchParams({ url: 'https://new-site.ch' });

    expect(shouldRestoreWizardState(restored, params, 'new-site.ch')).toBe(false);
  });
});
