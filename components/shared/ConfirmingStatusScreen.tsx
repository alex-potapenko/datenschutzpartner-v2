'use client';

import { ScanLoader } from '@/components/shared/ScanLoader';

/** Full-screen loader during account registration flows (wizard summary, EU Rep guest checkout). */
export function ConfirmingStatusScreen({ title }: { title: string }) {
  return <ScanLoader layout="page" label={title} />;
}
