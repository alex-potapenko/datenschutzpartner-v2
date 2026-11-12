import { cn } from '@/lib/utils';

export const TEAM_HERO_IMAGE_SRC = '/team.webp';
export const GENERATOR_HERO_IMAGE_SRC = '/generator-hero.webp';

/** Cover panel (no squircle). Default aspect matches team.webp (1024×682). */
export const teamHeroCoverClassName = 'relative aspect-[1024/682] w-full bg-cover bg-center';

type TeamHeroImageProps = {
  alt: string;
  className?: string;
  imageSrc?: string;
  /** Squircle corners for marketing teasers (e.g. home About block). */
  squircle?: boolean;
};

export function TeamHeroCover({
  alt,
  className,
  imageSrc = TEAM_HERO_IMAGE_SRC,
  squircle = false,
}: TeamHeroImageProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        teamHeroCoverClassName,
        'max-w-full min-w-0',
        squircle && 'squircle overflow-hidden',
        className
      )}
      style={{ backgroundImage: `url('${imageSrc}')` }}
    />
  );
}

export function TeamHeroImage(props: TeamHeroImageProps) {
  return <TeamHeroCover {...props} />;
}
