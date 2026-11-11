import { cn } from '@/lib/utils';

type TeamHeroImageProps = {
  alt: string;
  className?: string;
};

/** Full-width team frame (1024×682 source); image shifted up inside a fixed aspect box. */
export function TeamHeroImage({ alt, className }: TeamHeroImageProps) {
  return (
    <div className={cn('relative aspect-[1024/682] w-full overflow-hidden', className)}>
      <img
        src="/team.webp"
        alt={alt}
        width={1024}
        height={682}
        decoding="async"
        className="absolute top-[-52px] left-0 h-[calc(100%+52px)] w-full object-cover object-top"
      />
    </div>
  );
}
