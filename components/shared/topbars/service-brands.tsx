import type { ReactNode } from 'react';
import { FileText, FlagBanner } from '@/components/ui';

export type ServiceBrandId = 'privacyGenerator' | 'euRep';

type ServiceBrand = {
  icon: ReactNode;
  accent: string;
};

export const SERVICE_BRANDS: Record<ServiceBrandId, ServiceBrand> = {
  privacyGenerator: {
    icon: <FileText size={18} weight="fill" aria-hidden />,
    accent: 'var(--accent)',
  },
  euRep: {
    icon: <FlagBanner size={18} weight="fill" aria-hidden />,
    accent: 'var(--feature-indigo)',
  },
};

export function TopBarServiceMark({ serviceId }: { serviceId: ServiceBrandId }) {
  const brand = SERVICE_BRANDS[serviceId];

  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-white"
      aria-hidden
    >
      {brand.icon}
    </div>
  );
}
