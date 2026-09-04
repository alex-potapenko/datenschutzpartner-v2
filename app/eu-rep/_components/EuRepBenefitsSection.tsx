import { EuRepBenefitsPanel } from './EuRepBenefitsPanel';
import { EU_REP_LANDING_HREF } from '@/lib/account-routes';

export function EuRepBenefitsSection() {
  return <EuRepBenefitsPanel checkoutReturnTo={EU_REP_LANDING_HREF} />;
}
