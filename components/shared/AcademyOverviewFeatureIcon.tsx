import { Gavel, ListChecks, MicrophoneStage } from '@/components/ui';
import type { AcademyOverviewFeatureKey } from '@/lib/academy-content/constants';

const OVERVIEW_FEATURE_ICON_STYLES: Record<
  AcademyOverviewFeatureKey,
  { color: string; background: string }
> = {
  compliance: {
    color: 'var(--feature-purple)',
    background: 'color-mix(in srgb, var(--feature-purple) 12%, transparent)',
  },
  sessions: {
    color: 'var(--feature-red)',
    background: 'color-mix(in srgb, var(--feature-red) 12%, transparent)',
  },
  resources: {
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 12%, transparent)',
  },
};

const ICON_SIZES = {
  sm: { box: 'size-9 rounded-lg', icon: 18 },
  md: { box: 'size-12 rounded-xl', icon: 24 },
} as const;

type AcademyOverviewFeatureIconProps = {
  featureKey: AcademyOverviewFeatureKey;
  size?: keyof typeof ICON_SIZES;
};

function FeatureIconGlyph({
  featureKey,
  iconSize,
}: {
  featureKey: AcademyOverviewFeatureKey;
  iconSize: number;
}) {
  switch (featureKey) {
    case 'compliance':
      return <Gavel size={iconSize} weight="fill" aria-hidden />;
    case 'sessions':
      return <MicrophoneStage size={iconSize} weight="fill" aria-hidden />;
    case 'resources':
      return <ListChecks size={iconSize} weight="fill" aria-hidden />;
  }
}

export function AcademyOverviewFeatureIcon({
  featureKey,
  size = 'sm',
}: AcademyOverviewFeatureIconProps) {
  const { color, background } = OVERVIEW_FEATURE_ICON_STYLES[featureKey];
  const { box, icon } = ICON_SIZES[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${box}`}
      style={{ background, color }}
    >
      <FeatureIconGlyph featureKey={featureKey} iconSize={icon} />
    </div>
  );
}
