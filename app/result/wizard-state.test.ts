import { describe, expect, it } from 'vitest';
import type { QuestionnaireFormData } from './content/questionnaire-form';
import {
  emptyEuRepState,
  euRepOfferVariant,
  hasDocumentedEuRepAlternative,
  hasWizardUserProgress,
  isBuyingEuRep,
  isLinkingExistingEuRep,
  mergeEuRepIntoFormData,
  normalizeWizardStepId,
  shouldConfirmEuRepSkip,
  shouldResetIncompleteScan,
  shouldRestoreWizardState,
  shouldShowEuRepStep,
  showThirdPartyRepFields,
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
  it('includes eu-rep after questionnaire in update runs when applicable', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        questionnaireOnly: true,
        euRep: emptyEuRepState(),
        formData: form({ gdprApplicable: 'yes', transfersAbroad: 'worldwide' }),
      })
    ).toEqual(['questionnaire', 'eu-rep']);
  });

  it('omits eu-rep when questionnaire answers do not require it', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        questionnaireOnly: true,
        euRep: emptyEuRepState(),
        formData: form({ gdprApplicable: 'no' }),
      })
    ).toEqual(['questionnaire']);
  });

  it('includes eu-rep in the full generator flow when applicable', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        euRep: emptyEuRepState(),
        formData: form({ gdprApplicable: 'yes', transfersAbroad: 'worldwide' }),
      })
    ).toEqual(['scanning', 'questionnaire', 'eu-rep', 'summary', 'confirm']);
  });

  it('omits eu-rep in the full generator flow when GDPR does not apply', () => {
    expect(
      wizardStepOrder({
        scanDone: true,
        euRep: emptyEuRepState(),
        formData: form({ gdprApplicable: 'no' }),
      })
    ).toEqual(['scanning', 'questionnaire', 'summary', 'confirm']);
  });

  it('starts with the website-input step when no URL is present', () => {
    expect(
      wizardStepOrder({
        scanDone: false,
        hasWebsiteUrl: false,
        euRep: emptyEuRepState(),
      })
    ).toEqual(['website', 'scanning', 'questionnaire', 'summary', 'confirm']);
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
  it('is true when GDPR applies and data is exported abroad', () => {
    expect(shouldShowEuRepStep(form({ gdprApplicable: 'yes', transfersAbroad: 'worldwide' }))).toBe(
      true
    );
    expect(shouldShowEuRepStep(form({ gdprApplicable: 'dontknow', transfersAbroad: 'eea' }))).toBe(
      true
    );
  });

  it('is false when GDPR does not apply', () => {
    expect(shouldShowEuRepStep(form({ gdprApplicable: 'no', transfersAbroad: 'worldwide' }))).toBe(
      false
    );
  });

  it('is false when data is not exported abroad', () => {
    expect(shouldShowEuRepStep(form({ gdprApplicable: 'yes', transfersAbroad: 'no' }))).toBe(false);
  });

  it('is false without questionnaire data', () => {
    expect(shouldShowEuRepStep()).toBe(false);
  });
});

describe('eu rep step helpers', () => {
  it('shows third-party fields when another provider was named', () => {
    expect(showThirdPartyRepFields({ hasNamedEuRep: 'yes', namedDatenschutzpartner: 'no' })).toBe(
      true
    );
    expect(showThirdPartyRepFields({ hasNamedEuRep: 'yes', namedDatenschutzpartner: 'yes' })).toBe(
      false
    );
  });

  it('picks the right offer variant', () => {
    expect(euRepOfferVariant({ hasNamedEuRep: 'no', namedDatenschutzpartner: '' })).toBe('new');
    expect(euRepOfferVariant({ hasNamedEuRep: 'yes', namedDatenschutzpartner: 'no' })).toBe(
      'switch'
    );
    expect(euRepOfferVariant({ hasNamedEuRep: 'yes', namedDatenschutzpartner: 'yes' })).toBeNull();
  });

  it('requires skip confirmation when GDPR applies and no rep is documented', () => {
    expect(
      shouldConfirmEuRepSkip(form(), {
        hasNamedEuRep: 'no',
        declined: true,
        done: true,
      })
    ).toBe(true);
  });

  it('does not require skip confirmation when a third-party rep is documented', () => {
    expect(
      shouldConfirmEuRepSkip(form(), {
        hasNamedEuRep: 'yes',
        namedDatenschutzpartner: 'no',
        thirdPartyRepName: 'Other GmbH',
        thirdPartyRepStreet: 'Street 1',
        thirdPartyRepPostalCode: '10115',
        thirdPartyRepCity: 'Berlin',
        thirdPartyRepCountry: 'Deutschland',
        thirdPartyRepEmail: 'rep@example.com',
        declined: true,
        done: true,
      })
    ).toBe(false);
    expect(
      hasDocumentedEuRepAlternative({
        hasNamedEuRep: 'yes',
        namedDatenschutzpartner: 'yes',
      })
    ).toBe(true);
  });

  it('does not require skip confirmation when GDPR does not apply', () => {
    expect(
      shouldConfirmEuRepSkip(form({ gdprApplicable: 'no' }), {
        hasNamedEuRep: 'no',
        declined: true,
        done: true,
      })
    ).toBe(false);
  });

  it('merges eu-rep answers into questionnaire form data', () => {
    const merged = mergeEuRepIntoFormData(form(), {
      hasNamedEuRep: 'yes',
      namedDatenschutzpartner: 'no',
      thirdPartyRepName: 'Other GmbH',
      thirdPartyRepStreet: 'Street 1',
      thirdPartyRepPostalCode: '10115',
      thirdPartyRepCity: 'Berlin',
      thirdPartyRepCountry: 'Deutschland',
      thirdPartyRepEmail: 'rep@example.com',
    });

    expect(merged.hasThirdPartyEuRep).toBe('yes');
    expect(merged.thirdPartyRepName).toBe('Other GmbH');
    expect(merged.thirdPartyRepEmail).toBe('rep@example.com');
  });
});

describe('shouldResetIncompleteScan', () => {
  it('resets a running scan so reload shows the website input', () => {
    expect(shouldResetIncompleteScan('scanning', false, false)).toBe(true);
    expect(shouldResetIncompleteScan('scan', false, false)).toBe(true);
  });

  it('does not reset a completed scan or a policy-update run', () => {
    expect(shouldResetIncompleteScan('scanning', true, false)).toBe(false);
    expect(shouldResetIncompleteScan('scanning', false, true)).toBe(false);
    expect(shouldResetIncompleteScan('website', false, false)).toBe(false);
    expect(shouldResetIncompleteScan('questionnaire', false, false)).toBe(false);
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
