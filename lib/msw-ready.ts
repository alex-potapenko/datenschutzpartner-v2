import { env } from '@/env';

const MSW_START_TIMEOUT_MS = 4_000;

let mswReady: Promise<void> | undefined;
let fetchFallbackInstalled = false;

async function installFetchFallback(): Promise<void> {
  if (fetchFallbackInstalled || typeof window === 'undefined') return;
  fetchFallbackInstalled = true;

  const [{ getResponse }, { handlers }] = await Promise.all([
    import('msw'),
    import('@/mocks/handlers'),
  ]);

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url, window.location.origin);

    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    const mocked = await getResponse(handlers, request);
    if (mocked) return mocked;

    return originalFetch(input, init);
  };
}

async function startMswWorker(): Promise<void> {
  try {
    const { worker } = await import('@/mocks/browser');
    await Promise.race([
      worker.start({ onUnhandledRequest: 'bypass', quiet: true }),
      new Promise<void>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error('msw_start_timeout'));
        }, MSW_START_TIMEOUT_MS);
      }),
    ]);
  } catch {
    /* Service worker unavailable (embedded browsers) — fall back to fetch interception. */
    await installFetchFallback();
  }
}

/** Ensure the browser MSW worker is running before mock API requests. */
export function waitForMsw(): Promise<void> {
  if (env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return Promise.resolve();
  }

  if (!mswReady) {
    mswReady =
      typeof navigator !== 'undefined' && 'serviceWorker' in navigator
        ? startMswWorker()
        : installFetchFallback();
  }

  return mswReady;
}
