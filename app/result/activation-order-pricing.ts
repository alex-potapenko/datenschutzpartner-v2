import {
  calculateEuRepQuote,
  calculateGeneratorPolicyQuote,
  qualifyingSiteCountForCheckout,
} from '@/api/checkout';
import { isBuyingEuRep, type EuRepState } from './wizard-state';

export function calculateActivationOrderPricing(
  euRep: EuRepState,
  options: { fillSubscriptionId?: string; activePolicySiteCount?: number } = {}
) {
  const withEuRep = isBuyingEuRep(euRep);
  const isFillSlot = Boolean(options.fillSubscriptionId);
  const activeSites = Math.max(0, options.activePolicySiteCount ?? 0);

  const policyQuote = isFillSlot
    ? { amountDue: 0 }
    : calculateGeneratorPolicyQuote(
        qualifyingSiteCountForCheckout(activeSites + 1, 'generator', 1),
        1
      );

  const euRepQuote = withEuRep ? calculateEuRepQuote(euRep.plan ?? 'basis') : null;

  return {
    withEuRep,
    isFillSlot,
    policyAmount: policyQuote.amountDue,
    euRepAmount: euRepQuote?.amountDue ?? 0,
  };
}
