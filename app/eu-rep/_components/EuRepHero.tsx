import { FullBleedDivider } from '@/components/shared/FullBleedDivider';
import { EuRepHeroContent } from './EuRepHeroContent';

export function EuRepHero() {
  return (
    <section className="bg-background">
      <EuRepHeroContent />
      <FullBleedDivider />
    </section>
  );
}
