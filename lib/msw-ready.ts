import { env } from '@/env';

let mswReady: Promise<void> | undefined;

/** Ensure the browser MSW worker is running before mock API requests. */
export function waitForMsw(): Promise<void> {
  if (env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return Promise.resolve();
  }

  if (!mswReady) {
    mswReady = import('@/mocks/browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .then(() => undefined)
      .catch(() => undefined);
  }

  return mswReady;
}
