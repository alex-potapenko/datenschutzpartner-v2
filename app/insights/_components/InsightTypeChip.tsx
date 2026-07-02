import { Button } from '@/components/ui';

type InsightTypeChipProps = {
  label: string;
  className?: string;
};

/** Static hero chip — transparent with white label on cover image. */
export function InsightTypeChip({ label, className }: InsightTypeChipProps) {
  return (
    <Button
      variant="ghost"
      size="lg"
      className={[
        'pointer-events-none w-fit border border-white/40 bg-transparent text-white shadow-none hover:bg-transparent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </Button>
  );
}
