import { cn } from '@/lib/utils';

export function TopBarDivider({ className }: { className?: string }) {
  return <div aria-hidden className={cn('h-6 w-px shrink-0 bg-white/20', className)} />;
}
