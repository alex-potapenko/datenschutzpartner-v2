import { z } from 'zod';
import type { QuestionnaireFormData } from '@/app/result/content/questionnaire-form';

export type { QuestionnaireFormData } from '@/app/result/content/questionnaire-form';

const yesNo = z.enum(['yes', 'no', '']);
const yesNoDontKnow = z.enum(['yes', 'no', 'dontknow', '']);
const transfersAbroad = z.enum(['no', 'eea', 'worldwide', '']);
const videoRetention = z.enum(['none', 'duration', 'asRequired', '']);
const videoRetentionUnit = z.enum(['hours', 'days', '']);

export const questionnaireFormSchema = z
  .object({
    companyName: z.string().min(1, 'validation.required'),
    domain: z.string().min(1, 'validation.required'),
    email: z.email('validation.email'),
    street: z.string().min(1, 'validation.required'),
    streetLine2: z.string(),
    postalCode: z.string().min(1, 'validation.required'),
    city: z.string().min(1, 'validation.required'),
    country: z.string().min(1, 'validation.required'),
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
      if (!data.dpoCompanyName.trim()) {
        ctx.addIssue({ code: 'custom', path: ['dpoCompanyName'], message: 'validation.required' });
      }
      if (!data.dpoStreet.trim()) {
        ctx.addIssue({ code: 'custom', path: ['dpoStreet'], message: 'validation.required' });
      }
      if (!data.dpoPostalCode.trim()) {
        ctx.addIssue({ code: 'custom', path: ['dpoPostalCode'], message: 'validation.required' });
      }
      if (!data.dpoCity.trim()) {
        ctx.addIssue({ code: 'custom', path: ['dpoCity'], message: 'validation.required' });
      }
      if (!data.dpoCountry.trim()) {
        ctx.addIssue({ code: 'custom', path: ['dpoCountry'], message: 'validation.required' });
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

    if (showThirdPartyEuRepQuestion(data) && !data.hasThirdPartyEuRep) {
      ctx.addIssue({
        code: 'custom',
        path: ['hasThirdPartyEuRep'],
        message: 'validation.required',
      });
    }

    if (data.hasThirdPartyEuRep === 'yes') {
      if (!data.thirdPartyRepName.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['thirdPartyRepName'],
          message: 'validation.required',
        });
      }
      if (!data.thirdPartyRepStreet.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['thirdPartyRepStreet'],
          message: 'validation.required',
        });
      }
      if (!data.thirdPartyRepPostalCode.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['thirdPartyRepPostalCode'],
          message: 'validation.required',
        });
      }
      if (!data.thirdPartyRepCity.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['thirdPartyRepCity'],
          message: 'validation.required',
        });
      }
      if (!data.thirdPartyRepCountry.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['thirdPartyRepCountry'],
          message: 'validation.required',
        });
      }
      if (
        !data.thirdPartyRepEmail.trim() ||
        !z.email().safeParse(data.thirdPartyRepEmail.trim()).success
      ) {
        ctx.addIssue({ code: 'custom', path: ['thirdPartyRepEmail'], message: 'validation.email' });
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
