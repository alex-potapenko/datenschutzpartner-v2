/**
 * Tiny persistent mock store. In the browser it survives reloads via
 * localStorage, so a clickable prototype keeps its state during a demo.
 * In node (vitest) there is no localStorage, so it stays in-memory and
 * resets between tests — exactly what we want.
 *
 * Browser reads/writes go through storage on every operation so multiple
 * MSW handler bundles (e.g. service worker vs main-thread fetch) cannot
 * diverge from the same persisted rows.
 *
 * This lives behind the api/ + MSW seam: components are unaware of it,
 * and it disappears entirely when the real backend replaces the mocks.
 */
type Identifiable = { id: string };

const STORAGE_PREFIX = 'mp-mock:';
const canPersist = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/** Vitest / node — one in-memory table per collection key. */
const memoryByKey = new Map<string, Identifiable[]>();

export interface Collection<T extends Identifiable> {
  all: () => T[];
  create: (item: Omit<T, 'id'> & { id?: string }) => T;
  remove: (id: string) => boolean;
  update: (id: string, patch: Partial<Omit<T, 'id'>>) => T | undefined;
  /** Replace persisted rows with a fresh copy of `seed` (prototype dev reset). */
  reseed: (seed: T[]) => void;
}

function loadItems<T extends Identifiable>(key: string, seed: T[]): T[] {
  if (canPersist) {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T[]) : structuredClone(seed);
  }

  const existing = memoryByKey.get(key);
  if (existing) {
    return [...(existing as T[])];
  }

  const initial = structuredClone(seed);
  memoryByKey.set(key, initial);
  return [...initial];
}

function saveItems(key: string, items: Identifiable[]): void {
  const snapshot = structuredClone(items);
  if (canPersist) {
    window.localStorage.setItem(key, JSON.stringify(snapshot));
    return;
  }
  memoryByKey.set(key, snapshot);
}

/**
 * Create a persistent collection. `seed` is used only on first load (when
 * nothing is stored yet); afterwards the persisted data wins so user edits
 * survive reloads. Bump `version` to force a reseed after changing `seed`.
 */
export function createCollection<T extends Identifiable>(
  name: string,
  seed: T[],
  version = 1
): Collection<T> {
  const key = `${STORAGE_PREFIX}${name}:v${String(version)}`;

  function nextId(items: T[]): string {
    const max = items.reduce((acc, item) => Math.max(acc, Number(item.id) || 0), 0);
    return String(max + 1);
  }

  return {
    all: () => loadItems(key, seed),
    create: (item: Omit<T, 'id'> & { id?: string }) => {
      const items = loadItems(key, seed);
      const created = { ...item, id: item.id ?? nextId(items) } as T;
      items.push(created);
      saveItems(key, items);
      return created;
    },
    remove: (id) => {
      const items = loadItems(key, seed);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return false;
      }
      items.splice(index, 1);
      saveItems(key, items);
      return true;
    },
    update: (id, patch) => {
      const items = loadItems(key, seed);
      const existing = items.find((item) => item.id === id);
      if (!existing) {
        return undefined;
      }
      Object.assign(existing, patch);
      saveItems(key, items);
      return existing;
    },
    reseed: (nextSeed) => {
      saveItems(key, structuredClone(nextSeed));
    },
  };
}
