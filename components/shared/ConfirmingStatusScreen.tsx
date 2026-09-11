'use client';

import { Spinner } from '@/components/ui';

export function ConfirmingStatusScreen({ title }: { title: string }) {
  return (
    <main className="bg-background flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-5 text-center">
        <span className="bg-accent/10 flex size-14 items-center justify-center rounded-2xl">
          <Spinner size="lg" aria-hidden />
        </span>
        <h1 className="font-display text-foreground text-2xl font-bold sm:text-3xl">{title}</h1>
      </div>
    </main>
  );
}
