import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// jsdom ships getRandomValues but no SubtleCrypto; browsers on localhost/HTTPS do.
if (!globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

// The same MSW handlers that power the prototype also power the tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
