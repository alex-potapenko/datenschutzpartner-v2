'use client';

import { Button, CaretLeft } from '@/components/ui';
import { topBarOutlineButtonClass } from './constants';

export { topBarOutlineButtonClass };

export function TopBarIconBackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      variant="outline"
      size="md"
      isIconOnly
      className={topBarOutlineButtonClass}
      aria-label={label}
      onPress={onPress}
    >
      <CaretLeft size={16} weight="bold" />
    </Button>
  );
}
