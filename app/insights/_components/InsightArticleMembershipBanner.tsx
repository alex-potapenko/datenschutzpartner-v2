'use client';

import { AcademyMembershipPromoBanner } from '@/components/shared/AcademyMembershipPromoBanner';
import type { InsightsTab } from '@/lib/insights-content';

type InsightArticleMembershipBannerProps = {
  tab: Extract<InsightsTab, 'webinars' | 'newsQuestions'>;
};

export function InsightArticleMembershipBanner({ tab }: InsightArticleMembershipBannerProps) {
  return (
    <AcademyMembershipPromoBanner
      variant="horizontal"
      sessionType={tab}
      className="mt-10 sm:mt-12"
    />
  );
}
