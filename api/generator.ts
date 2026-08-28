import { z } from 'zod';
import type { ImprovedFormData } from '@/app/result/content/improved-form';

export type { ImprovedFormData } from '@/app/result/content/improved-form';

const yesNo = z.enum(['yes', 'no', '']);
const yesNoDontKnow = z.enum(['yes', 'no', 'dontknow', '']);

export const improvedFormSchema = z
  .object({
    companyName: z.string().min(1, 'validation.required'),
    domain: z.string().min(1, 'validation.required'),
    email: z.email('validation.email'),
    street: z.string().min(1, 'validation.required'),
    postalCode: z.string().min(1, 'validation.required'),
    city: z.string().min(1, 'validation.required'),
    country: z.string().min(1, 'validation.required'),
    generatesRevenue: yesNo,
    revenueTypes: z.array(z.string()),
    processesSpecialData: yesNo,
    specialDataCategories: z.array(z.string()),
    basedInSwitzerland: yesNo,
    processesEUData: yesNoDontKnow,
    systematically: yesNoDontKnow,
    offersToEU: yesNoDontKnow,
    monitorsEUBehaviour: yesNoDontKnow,
    hasEUEstablishment: yesNo,
    transfersToThirdCountry: yesNoDontKnow,
    usesDataForMarketing: yesNo,
    usesProfiling: yesNo,
    hasEmployeePrivacyNotice: yesNo,
    employeePrivacyUrl: z.string(),
    listSupervisoryAuthority: yesNo,
    supervisoryAuthority: z.string(),
  })
  .superRefine((data, ctx) => {
    const requiredYesNo = [
      'generatesRevenue',
      'processesSpecialData',
      'basedInSwitzerland',
      'processesEUData',
      'hasEUEstablishment',
      'transfersToThirdCountry',
      'usesDataForMarketing',
      'usesProfiling',
      'hasEmployeePrivacyNotice',
      'listSupervisoryAuthority',
    ] as const satisfies readonly (keyof ImprovedFormData)[];

    for (const field of requiredYesNo) {
      if (!data[field]) {
        ctx.addIssue({ code: 'custom', path: [field], message: 'validation.required' });
      }
    }

    const euRepVisible = getVisibleEuRepQuestionFields(data);

    if (euRepVisible.offersToEU && !data.offersToEU) {
      ctx.addIssue({ code: 'custom', path: ['offersToEU'], message: 'validation.required' });
    }

    if (euRepVisible.monitorsEUBehaviour && !data.monitorsEUBehaviour) {
      ctx.addIssue({
        code: 'custom',
        path: ['monitorsEUBehaviour'],
        message: 'validation.required',
      });
    }

    if (data.generatesRevenue === 'yes' && data.revenueTypes.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['revenueTypes'], message: 'validation.required' });
    }

    if (data.processesSpecialData === 'yes' && data.specialDataCategories.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['specialDataCategories'],
        message: 'validation.required',
      });
    }

    if (data.processesEUData === 'yes' && !data.systematically) {
      ctx.addIssue({ code: 'custom', path: ['systematically'], message: 'validation.required' });
    }

    if (data.hasEmployeePrivacyNotice === 'yes' && !data.employeePrivacyUrl.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['employeePrivacyUrl'],
        message: 'validation.required',
      });
    }

    if (data.listSupervisoryAuthority === 'yes' && !data.supervisoryAuthority) {
      ctx.addIssue({
        code: 'custom',
        path: ['supervisoryAuthority'],
        message: 'validation.required',
      });
    }
  });

/** Matches {@link EuRepQuestionnaireFlow} visibility: hide EU-offer questions when not based outside the EEA; hide Q3 when Q2 is yes. */
export function getVisibleEuRepQuestionFields(
  form: Pick<ImprovedFormData, 'basedInSwitzerland' | 'offersToEU'>
): { offersToEU: boolean; monitorsEUBehaviour: boolean } {
  if (form.basedInSwitzerland !== 'yes') {
    return { offersToEU: false, monitorsEUBehaviour: false };
  }
  if (form.offersToEU === 'yes') {
    return { offersToEU: true, monitorsEUBehaviour: false };
  }
  return { offersToEU: true, monitorsEUBehaviour: true };
}
