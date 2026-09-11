'use client';

import type { ReactNode } from 'react';
import { CheckCircle } from '@/components/ui';

type PurchaseOrderConfirmationLayoutProps = {
  titleLine1: string;
  titleLine2?: string;
  body?: ReactNode;
  orderSection: ReactNode;
  afterOrder?: ReactNode;
  footer: ReactNode;
};

export function PurchaseOrderConfirmationLayout({
  titleLine1,
  titleLine2,
  body,
  orderSection,
  afterOrder,
  footer,
}: PurchaseOrderConfirmationLayoutProps) {
  return (
    <main className="bg-background flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-10">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="bg-success-soft flex size-14 items-center justify-center rounded-2xl">
            <CheckCircle size={28} weight="fill" className="text-success" aria-hidden />
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-foreground text-2xl font-bold sm:text-3xl">
              {titleLine1}
              {titleLine2 ? (
                <>
                  <br />
                  {titleLine2}
                </>
              ) : null}
            </h1>
            {body ? (
              <p className="text-foreground text-base leading-relaxed text-pretty">{body}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {orderSection}
          {afterOrder}
        </div>

        <div className="flex flex-col items-center text-center">{footer}</div>
      </div>
    </main>
  );
}
