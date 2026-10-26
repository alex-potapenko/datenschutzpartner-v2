import { afterEach, describe, expect, it } from 'vitest';
import { createCollection } from './db';

type Row = { id: string; value: number };

const TEST_KEY = 'sync-test';
const TEST_VERSION = 99_999;

afterEach(() => {
  createCollection<Row>(TEST_KEY, [{ id: '1', value: 0 }], TEST_VERSION).reseed([
    { id: '1', value: 0 },
  ]);
});

describe('createCollection', () => {
  it('shares rows when two instances use the same storage key', () => {
    const left = createCollection<Row>(TEST_KEY, [{ id: '1', value: 0 }], TEST_VERSION);
    const right = createCollection<Row>(TEST_KEY, [{ id: '1', value: 0 }], TEST_VERSION);

    left.update('1', { value: 42 });

    expect(right.all()[0]?.value).toBe(42);
  });
});
