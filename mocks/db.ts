/**
 * Tiny persistent mock store. In the browser it survives reloads via
 * localStorage, so a clickable prototype keeps its state during a demo.
 * In node (vitest) there is no localStorage, so it stays in-memory and
 * resets between tests — exactly what we want.
 *
 * This lives behind the api/ + MSW seam: components are unaware of it,
 * and it disappears entirely when the real backend replaces the mocks.
 */
type Identifiable = { id: string };

const STORAGE_PREFIX = 'mp-mock:';
const canPersist = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export interface Collection<T extends Identifiable> {
  all: () => T[];
  create: (item: Omit<T, 'id'> & { id?: string }) => T;
  remove: (id: string) => boolean;
  update: (id: string, patch: Partial<Omit<T, 'id'>>) => T | undefined;
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
  let items: T[];

  if (canPersist) {
    const stored = window.localStorage.getItem(key);
    items = stored ? (JSON.parse(stored) as T[]) : [...seed];
  } else {
    items = [...seed];
  }

  function persist() {
    if (canPersist) {
      window.localStorage.setItem(key, JSON.stringify(items));
    }
  }

  function nextId(): string {
    const max = items.reduce((acc, item) => Math.max(acc, Number(item.id) || 0), 0);
    return String(max + 1);
  }

  return {
    all: () => [...items],
    create: (item: Omit<T, 'id'> & { id?: string }) => {
      const created = { ...item, id: item.id ?? nextId() } as T;
      items.push(created);
      persist();
      return created;
    },
    remove: (id) => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return false;
      }
      items.splice(index, 1);
      persist();
      return true;
    },
    update: (id, patch) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) {
        return undefined;
      }
      Object.assign(existing, patch);
      persist();
      return existing;
    },
  };
}
