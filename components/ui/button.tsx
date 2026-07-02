/**
 * Local seam over HeroUI Button.
 * App code imports from '@/components/ui' — never from '@heroui/*' directly.
 */
import { Button as HeroUIButton, ButtonGroup, type ButtonProps } from '@heroui/react';
import { cn } from '@/lib/utils';

function Button({ className, ...props }: ButtonProps) {
  return <HeroUIButton className={cn('font-display', className)} {...props} />;
}

export { Button, ButtonGroup };
export type { ButtonProps };
