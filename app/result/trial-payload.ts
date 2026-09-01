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
  const legalEntity = euRep.legalEntity ?? formData.companyName;
  const forwardingEmail = euRep.forwardingEmail ?? formData.email;

  return {
    kind: 'generator',
    siteCount: 1,
    domain,
    policyName: 'Privacy Policy',
    legalEntity: formData.companyName.trim() || undefined,
    fillSubscriptionId,
    euRepEntityCount: buyingEuRep ? 1 : undefined,
    euRepEntities: buyingEuRep
      ? [{ legalEntity: legalEntity.trim(), forwardingEmail: forwardingEmail.trim() }]
      : undefined,
    euRepLinkContractId: linkingExisting ? euRep.linkContractId : undefined,
  };
}
