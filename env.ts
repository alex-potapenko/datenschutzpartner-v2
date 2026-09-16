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
    NEXT_PUBLIC_HOSTED_POLICY_ORIGIN: z.url().optional(),
    /** Landing hero right column: orbit icons or client portrait. */
    NEXT_PUBLIC_HERO_VISUAL: z.enum(['orbitIcons', 'clientPortrait']).optional(),
    /** Set to `disabled` to hide Orbit / Portrait tabs (e.g. after launch). */
    NEXT_PUBLIC_HERO_VARIANT_SWITCHER: z.enum(['enabled', 'disabled']).optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
    NEXT_PUBLIC_HOSTED_POLICY_ORIGIN: process.env.NEXT_PUBLIC_HOSTED_POLICY_ORIGIN,
    NEXT_PUBLIC_HERO_VISUAL: process.env.NEXT_PUBLIC_HERO_VISUAL,
    NEXT_PUBLIC_HERO_VARIANT_SWITCHER: process.env.NEXT_PUBLIC_HERO_VARIANT_SWITCHER,
  },
  emptyStringAsUndefined: true,
});
