'use client';

import { Container } from './Container';
import { InsightsPanel } from './InsightsPanel';
import { HOMEPAGE_INSIGHTS_LIMIT } from '@/lib/insights-content';

export function InsightsSection() {
  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border relative border-r border-l">
          <InsightsPanel
            limit={HOMEPAGE_INSIGHTS_LIMIT}
            showAllLink
            headerClassName="pt-16 pb-6 sm:pt-24 sm:pb-8 lg:pt-36"
          />
        </div>
      </Container>
    </section>
  );
}
