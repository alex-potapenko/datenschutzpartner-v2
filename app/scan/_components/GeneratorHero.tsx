import { GeneratorHeroContent } from './GeneratorHeroContent';

export function GeneratorHero({ fillSubscriptionId }: { fillSubscriptionId?: string }) {
  return (
    <section id="generator-hero" className="border-border bg-background scroll-mt-24 border-b">
      <GeneratorHeroContent fillSubscriptionId={fillSubscriptionId} />
    </section>
  );
}
