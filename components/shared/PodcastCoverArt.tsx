import { cn } from '@/lib/utils';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { Logo } from '@/components/shared/Logo';
import { Microphone } from '@/components/ui';
import { PodcastCoverRingLabel } from '@/components/shared/PodcastCoverRingLabel';

/** Shared frame ratio so card thumbnails match the featured tile composition. */
export const PODCAST_COVER_ASPECT_CLASS = 'aspect-[16/9]';

type PodcastCoverArtProps = {
  className?: string;
  aspectClassName?: string;
  /** Featured tile / hero — viewport glow. Thumbnail cards scale glow to match. */
  size?: 'featured' | 'thumbnail';
  /** Curved label around the microphone (i18n). */
  ringWord1: string;
  ringWord2: string;
  /** Article hero — full-bleed, no squircle corners. */
  rounded?: boolean;
};

/** Fixed podcast episode cover — EuRep-style glow on white, oversized white mark, microphone. */
export function PodcastCoverArt({
  className,
  aspectClassName = PODCAST_COVER_ASPECT_CLASS,
  size = 'featured',
  ringWord1,
  ringWord2,
  rounded = true,
}: PodcastCoverArtProps) {
  const isThumbnail = size === 'thumbnail';

  return (
    <div
      className={cn(
        'membership-soft-panel relative w-full shrink-0 overflow-hidden bg-white [box-shadow:inset_0_0_80px_color-mix(in_srgb,var(--key-500)_10%,transparent)]',
        rounded ? 'squircle' : 'rounded-none',
        isThumbnail && '@container',
        aspectClassName,
        className
      )}
      aria-hidden
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden',
          rounded ? 'squircle' : 'rounded-none'
        )}
      >
        <HeroGlowOrbs fit={isThumbnail ? 'container' : 'viewport'} />
      </div>
      <div className="relative flex h-full items-center justify-center overflow-visible">
        <span className="pointer-events-none absolute top-1/2 left-1/2 flex aspect-square h-[145%] w-[145%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <Logo
            showText={false}
            inverse
            className="flex size-full"
            markClassName="size-full bg-white/50"
          />
        </span>
        <div
          className={cn(
            'relative z-10 aspect-square overflow-visible',
            isThumbnail ? 'h-[50%] w-[50%]' : 'size-52'
          )}
        >
          <PodcastCoverRingLabel word1={ringWord1} word2={ringWord2} />
          {isThumbnail ? (
            <Microphone
              weight="fill"
              className="text-accent absolute top-1/2 left-1/2 aspect-square h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2"
              aria-hidden
            />
          ) : (
            <Microphone
              size={72}
              weight="fill"
              className="text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
}
