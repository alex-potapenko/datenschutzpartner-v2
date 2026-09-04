import type { CheckoutSessionCreate } from '@/api/checkout';
import type { QuestionnaireFormData } from './content/questionnaire-form';
import { isBuyingEuRep, isLinkingExistingEuRep, type EuRepState } from './wizard-state';

export function buildTrialCheckoutPayload(
  domain: string,
  formData: QuestionnaireFormData,
  euRep: EuRepState,
  fillSubscriptionId?: string
): CheckoutSessionCreate {
  const buyingEuRep = isBuyingEuRep(euRep);
  const linkingExisting = isLinkingExistingEuRep(euRep);
  const legalEntity = (euRep.legalEntity ?? formData.companyName ?? '').trim();
  const forwardingEmail = (euRep.forwardingEmail ?? formData.email ?? '').trim();

  return {
    kind: 'generator',
    siteCount: 1,
    domain,
    policyName: 'Privacy Policy',
    legalEntity: formData.companyName?.trim() || undefined,
    fillSubscriptionId,
    euRepPlanId: buyingEuRep ? euRep.plan : undefined,
    euRepEntityCount: buyingEuRep ? 1 : undefined,
    euRepEntities: buyingEuRep
      ? [
          {
            legalEntity: legalEntity || formData.companyName.trim(),
            forwardingEmail: forwardingEmail || formData.email.trim(),
            postalLine1: euRep.postalLine1?.trim() || formData.street.trim(),
            postalLine2: euRep.postalLine2?.trim() || formData.streetLine2.trim(),
            postalCode: euRep.postalCode?.trim() || formData.postalCode.trim(),
            city: euRep.city?.trim() || formData.city.trim(),
            country: euRep.country?.trim() || formData.country.trim(),
          },
        ]
      : undefined,
    euRepLinkContractId: linkingExisting ? euRep.linkContractId : undefined,
  };
}
