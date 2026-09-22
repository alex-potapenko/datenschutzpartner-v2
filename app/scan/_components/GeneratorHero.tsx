import { FullBleedDivider } from '@/components/shared/FullBleedDivider';
import { GeneratorHeroContent } from './GeneratorHeroContent';

export function GeneratorHero({ fillSubscriptionId }: { fillSubscriptionId?: string }) {
  return (
    <section id="generator-hero" className="bg-background scroll-mt-24">
      <GeneratorHeroContent fillSubscriptionId={fillSubscriptionId} />
      <FullBleedDivider />
    </section>
  );
}
