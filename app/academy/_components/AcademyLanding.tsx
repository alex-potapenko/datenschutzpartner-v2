import { AcademyFaqSection } from './AcademyFaqSection';
import { AcademyMembershipCard } from './AcademyMembershipSection';
import { AcademyOverviewSection } from './AcademyOverviewSection';
import { AcademyPreviewSection } from './AcademyPreviewSection';

export function AcademyLanding() {
  return (
    <>
      <section id="membership" className="border-border scroll-mt-24 border-b">
        <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
          <AcademyOverviewSection />
          <AcademyMembershipCard />
        </div>
      </section>

      <AcademyPreviewSection />
      <AcademyFaqSection />
    </>
  );
}
