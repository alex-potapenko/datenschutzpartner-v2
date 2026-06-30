'use client';

// Catches errors in the root layout itself. Must render its own <html>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 font-sans">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <button
          onClick={reset}
          className="rounded-lg border border-gray-300 px-4 py-2 font-semibold"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
