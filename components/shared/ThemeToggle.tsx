'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui';

/**
 * useSyncExternalStore is the lint-clean way to detect client-side mounting
 * without triggering the "setState in effect" rule. getServerSnapshot returns
 * false, getSnapshot returns true — value never changes, subscribe is a no-op.
 */
function useIsMounted() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');
  const mounted = useIsMounted();

  if (!mounted) {
    return <Button variant="ghost" size="sm" aria-label={t('toggleTheme')} isDisabled />;
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t('toggleTheme')}
      onPress={() => {
        setTheme(isDark ? 'light' : 'dark');
      }}
    >
      {isDark ? '☀' : '🌙'}
    </Button>
  );
}
