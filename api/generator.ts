import { z } from 'zod';
import type { QuestionnaireFormData } from '@/app/result/content/questionnaire-form';
import {
  cityNameField,
  companyNameField,
  countryNameField,
  domainField,
  emailField,
  optionalStreetLine2Field,
  postalCodeField,
  streetAddressField,
} from '@/lib/validation/fields';

export type { QuestionnaireFormData } from '@/app/result/content/questionnaire-form';

const yesNo = z.enum(['yes', 'no', '']);
const yesNoDontKnow = z.enum(['yes', 'no', 'dontknow', '']);
const transfersAbroad = z.enum(['no', 'eea', 'worldwide', '']);
const videoRetention = z.enum(['none', 'duration', 'asRequired', '']);
const videoRetentionUnit = z.enum(['hours', 'days', '']);

const dpoDetailsSchema = z.object({
  dpoCompanyName: companyNameField,
  dpoDesignation: companyNameField,
  dpoStreet: streetAddressField,
  dpoPostalCode: postalCodeField,
  dpoCity: cityNameField,
  dpoCountry: countryNameField,
});

export const questionnaireFormSchema = z
  .object({
    companyName: companyNameField,
    domain: domainField,
    email: emailField,
    street: streetAddressField,
    streetLine2: optionalStreetLine2Field,
    postalCode: postalCodeField,
    city: cityNameField,
    country: countryNameField,
    hasDpo: yesNo,
    dpoCompanyName: z.string(),
    dpoDesignation: z.string(),
    dpoStreet: z.string(),
    dpoPostalCode: z.string(),
    dpoCity: z.string(),
    dpoCountry: z.string(),
    dpoEmail: z.string(),
    gdprApplicable: yesNoDontKnow,
    offersToEU: yesNoDontKnow,
    monitorsEUBehaviour: yesNoDontKnow,
    transfersAbroad: transfersAbroad,
    usesProfiling: yesNoDontKnow,
    processesSpecialData: yesNoDontKnow,
    specialDataCategories: z.array(z.string()),
    usesAiProcessing: yesNo,
    acceptsApplications: yesNo,
    hasTalentPool: yesNo,
    usesVideoSurveillance: yesNo,
    videoRetention: videoRetention,
    videoRetentionAmount: z.string(),
    videoRetentionUnit: videoRetentionUnit,
    hasThirdPartyEuRep: yesNo,
    thirdPartyRepName: z.string(),
    thirdPartyRepStreet: z.string(),
    thirdPartyRepPostalCode: z.string(),
    thirdPartyRepCity: z.string(),
    thirdPartyRepCountry: z.string(),
    thirdPartyRepEmail: z.string(),
    basedInSwitzerland: yesNo,
  })
  .superRefine((data, ctx) => {
    const requiredYesNo = [
      'hasDpo',
      'gdprApplicable',
      'transfersAbroad',
      'usesProfiling',
      'processesSpecialData',
      'usesAiProcessing',
      'acceptsApplications',
      'usesVideoSurveillance',
    ] as const satisfies readonly (keyof QuestionnaireFormData)[];

    for (const field of requiredYesNo) {
      if (!data[field]) {
        ctx.addIssue({ code: 'custom', path: [field], message: 'validation.required' });
      }
    }

    const gdprBranch = getGdprBranchVisibility(data);

    if (gdprBranch.showEeaOffer && !data.offersToEU) {
      ctx.addIssue({ code: 'custom', path: ['offersToEU'], message: 'validation.required' });
    }

    if (gdprBranch.showEeaMonitoring && !data.monitorsEUBehaviour) {
      ctx.addIssue({
        code: 'custom',
        path: ['monitorsEUBehaviour'],
        message: 'validation.required',
      });
    }

    if (data.hasDpo === 'yes') {
      const dpoResult = dpoDetailsSchema.safeParse(data);
      if (!dpoResult.success) {
        for (const issue of dpoResult.error.issues) {
          ctx.addIssue({
            code: 'custom',
            path: issue.path,
            message: issue.message,
          });
        }
      }
    }

    if (data.usesVideoSurveillance === 'yes' && !data.videoRetention) {
      ctx.addIssue({ code: 'custom', path: ['videoRetention'], message: 'validation.required' });
    }

    if (data.usesVideoSurveillance === 'yes' && data.videoRetention === 'duration') {
      const amount = Number(data.videoRetentionAmount);
      if (!data.videoRetentionAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['videoRetentionAmount'],
          message: 'validation.required',
        });
      }
      if (!data.videoRetentionUnit) {
        ctx.addIssue({
          code: 'custom',
          path: ['videoRetentionUnit'],
          message: 'validation.required',
        });
      }
    }
  });

export function getGdprBranchVisibility(
  form: Pick<QuestionnaireFormData, 'gdprApplicable' | 'offersToEU'>
): { showEeaOffer: boolean; showEeaMonitoring: boolean } {
  const showEeaOffer = form.gdprApplicable === 'dontknow';
  const showEeaMonitoring = showEeaOffer && form.offersToEU === 'no';
  return { showEeaOffer, showEeaMonitoring };
}

/** Whether GDPR applies to this controller based on questionnaire answers. */
export function isGdprApplicable(
  form?: Pick<QuestionnaireFormData, 'gdprApplicable' | 'offersToEU' | 'monitorsEUBehaviour'>
): boolean {
  if (!form?.gdprApplicable) return false;
  if (form.gdprApplicable === 'yes') return true;
  if (form.gdprApplicable === 'no') return false;
  return form.offersToEU === 'yes' || form.monitorsEUBehaviour === 'yes';
}

/** Show the third-party EU representative question once GDPR applicability is known. */
export function showThirdPartyEuRepQuestion(
  form: Pick<QuestionnaireFormData, 'gdprApplicable' | 'offersToEU' | 'monitorsEUBehaviour'>
): boolean {
  return isGdprApplicable(form);
}

/** Matches EU-rep questionnaire branching when GDPR applicability is unknown. */
export function getVisibleEuRepQuestionFields(
  form: Pick<QuestionnaireFormData, 'gdprApplicable' | 'offersToEU'>
): { offersToEU: boolean; monitorsEUBehaviour: boolean } {
  const { showEeaOffer, showEeaMonitoring } = getGdprBranchVisibility(form);
  return {
    offersToEU: showEeaOffer,
    monitorsEUBehaviour: showEeaMonitoring,
  };
}
