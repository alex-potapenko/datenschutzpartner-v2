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
});
