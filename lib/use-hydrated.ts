'use client';

import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

/** True after mount — use for UI that must not run during SSR (e.g. React Aria collection state). */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
