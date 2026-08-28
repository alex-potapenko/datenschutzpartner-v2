'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@/components/ui';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { waitForMsw } from '@/lib/msw-ready';
import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { env } from '@/env';

const mockingEnabled = env.NEXT_PUBLIC_API_MOCKING === 'enabled';

/** Starts MSW in the background without blocking the App Router from initializing. */
function useMswInit() {
  useEffect(() => {
    if (!mockingEnabled) {
      return;
    }

    void waitForMsw().catch(() => {
      /* MSW is optional in dev; app still works against real endpoints. */
    });
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const router = useRouter();
  useMswInit();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <RouterProvider
        navigate={(href) => {
          startTransition(() => {
            router.push(href);
          });
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="bottom-center" toastOptions={{ className: 'squircle' }} />
        </QueryClientProvider>
      </RouterProvider>
    </ThemeProvider>
  );
}
