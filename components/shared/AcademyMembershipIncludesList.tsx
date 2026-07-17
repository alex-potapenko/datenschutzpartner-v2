import { Check } from '@/components/ui';
import {
  ACADEMY_MEMBERSHIP_FEATURE_GROUPS,
  type AcademyMembershipFeatureKey,
} from '@/lib/academy-content/events';

const MEMBERSHIP_FEATURE_KEYS = ACADEMY_MEMBERSHIP_FEATURE_GROUPS.flatMap(
  (group) => group.features
);

export function AcademyMembershipIncludesList({
  featureLabel,
}: {
  featureLabel: (key: AcademyMembershipFeatureKey) => string;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {MEMBERSHIP_FEATURE_KEYS.map((key) => (
        <li key={key} className="text-foreground flex items-start gap-2.5 text-sm leading-snug">
          <Check size={16} weight="bold" className="text-success mt-0.5 shrink-0" aria-hidden />
          {featureLabel(key)}
        </li>
      ))}
    </ul>
  );
}
