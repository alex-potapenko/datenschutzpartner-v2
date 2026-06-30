import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Typed environment variables. A missing or malformed variable fails the
 * build instead of surfacing at runtime. Add every new variable here —
 * never read process.env directly in app code.
 */
export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().min(1).default('/api'),
    NEXT_PUBLIC_API_MOCKING: z.enum(['enabled', 'disabled']).default('disabled'),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
  },
  emptyStringAsUndefined: true,
});
