import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW for vitest — wired up in vitest.setup.ts. */
export const server = setupServer(...handlers);
