import { env } from '@/env';

const MOCK_SW_RELOAD_FLAG = 'mp-msw:main-thread-reload';

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

async function unregisterMswServiceWorkers(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => registration.active?.scriptURL.includes('mockServiceWorker'))
      .map((registration) => registration.unregister())
  );
}

/**
 * Mock API handlers persist via `localStorage` (`mocks/db.ts`). MSW's service
 * worker runs handlers off the main thread where that storage is unavailable,
 * so secrets such as TOTP would live only in worker memory and diverge from
 * the authenticator app after reload. Intercept fetch on the main thread instead.
 */
function mockServiceWorkerControlsPage(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const scriptUrl = navigator.serviceWorker.controller?.scriptURL;
  return scriptUrl?.includes('mockServiceWorker') ?? false;
}

async function ensureBrowserMocking(): Promise<void> {
  const hadMockController = mockServiceWorkerControlsPage();
  await unregisterMswServiceWorkers();
  await installFetchFallback();

  if (typeof window !== 'undefined') {
    if (hadMockController && window.sessionStorage.getItem(MOCK_SW_RELOAD_FLAG) !== '1') {
      window.sessionStorage.setItem(MOCK_SW_RELOAD_FLAG, '1');
      window.location.reload();
      return;
    }
    window.sessionStorage.removeItem(MOCK_SW_RELOAD_FLAG);
  }
}

/** Ensure browser mock API interception is ready before requests. */
export function waitForMsw(): Promise<void> {
  if (env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return Promise.resolve();
  }

  if (!mswReady) {
    mswReady = typeof window !== 'undefined' ? ensureBrowserMocking() : Promise.resolve();
  }

  return mswReady;
}
