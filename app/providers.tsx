'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@/components/ui';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { env } from '@/env';

const mockingEnabled = env.NEXT_PUBLIC_API_MOCKING === 'enabled';

/**
 * Defers rendering until the MSW worker intercepts requests, so the first
 * queries can't slip past the mocks. No-op when mocking is disabled.
 */
function useMswReady() {
  const [ready, setReady] = useState(!mockingEnabled);
  useEffect(() => {
    if (!mockingEnabled) {
      return;
    }
    let active = true;
    void import('@/mocks/browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .then(() => {
        if (active) {
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  return ready;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const mswReady = useMswReady();
  const router = useRouter();

  if (!mswReady) {
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <RouterProvider
        navigate={(href) => {
          router.push(href);
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="bottom-center" />
        </QueryClientProvider>
      </RouterProvider>
    </ThemeProvider>
  );
}
