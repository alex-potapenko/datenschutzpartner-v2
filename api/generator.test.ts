import { describe, expect, it } from 'vitest';
import { questionnaireFormSchema } from './generator';

const emptyForm = {
  companyName: 'Site',
  domain: 'site.com',
  email: 'info@site.com',
  street: '',
  streetLine2: '',
  postalCode: '',
  city: '',
  country: 'Schweiz',
  hasDpo: '',
  dpoCompanyName: '',
  dpoDesignation: '',
  dpoStreet: '',
  dpoPostalCode: '',
  dpoCity: '',
  dpoCountry: '',
  dpoEmail: '',
  gdprApplicable: '',
  offersToEU: '',
  monitorsEUBehaviour: '',
  transfersAbroad: '',
  usesProfiling: '',
  processesSpecialData: '',
  specialDataCategories: [],
  usesAiProcessing: '',
  acceptsApplications: '',
  hasTalentPool: '',
  usesVideoSurveillance: '',
  videoRetention: '',
  videoRetentionAmount: '',
  videoRetentionUnit: '',
  hasThirdPartyEuRep: '',
  thirdPartyRepName: '',
  thirdPartyRepStreet: '',
  thirdPartyRepPostalCode: '',
  thirdPartyRepCity: '',
  thirdPartyRepCountry: '',
  thirdPartyRepEmail: '',
  basedInSwitzerland: 'yes',
} as const;

describe('questionnaireFormSchema', () => {
  it('rejects a questionnaire with unanswered mandatory radio questions', () => {
    const result = questionnaireFormSchema.safeParse(emptyForm);
    expect(result.success).toBe(false);
    if (result.success) return;

    const paths = result.error.issues.map((issue) => issue.path[0]);
    expect(paths).toContain('hasDpo');
    expect(paths).toContain('gdprApplicable');
    expect(paths).toContain('transfersAbroad');
    expect(paths).toContain('usesProfiling');
    expect(paths).toContain('processesSpecialData');
    expect(paths).toContain('usesAiProcessing');
    expect(paths).toContain('acceptsApplications');
    expect(paths).toContain('usesVideoSurveillance');
  });

  it('rejects invalid company names and postal codes', () => {
    const result = questionnaireFormSchema.safeParse({
      ...emptyForm,
      companyName: '!!!',
      street: 'Bahnhofstrasse 1',
      postalCode: '8001',
      city: 'Zürich',
      hasDpo: 'no',
      gdprApplicable: 'no',
      transfersAbroad: 'no',
      usesProfiling: 'no',
      processesSpecialData: 'no',
      usesAiProcessing: 'no',
      acceptsApplications: 'no',
      usesVideoSurveillance: 'no',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((issue) => issue.path[0])).toContain('companyName');
  });
});
