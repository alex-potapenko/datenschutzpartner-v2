import { type ReactNode } from 'react';
import { CheckCircle, Warning, WarningCircle, Lock } from '@/components/ui';
import { Chip } from '@/components/ui';
import { ScanItemIcon } from './ScanItemIcon';

interface ScanItem {
  label: string;
  value: string;
  icon: ReactNode;
  color: string;
}

interface ScanPreviewLabels {
  scan: string;
  issues: string;
  privacyPolicy: string;
  complete: string;
  issuesFound: string;
  notCompliant: string;
}

interface ScanPreviewCardProps {
  domain?: string;
  items: ScanItem[];
  labels: ScanPreviewLabels;
}

export function ScanPreviewCard({ domain = 'mywebsite.ch', items, labels }: ScanPreviewCardProps) {
  return (
    <div className="squircle border-border bg-background relative w-full max-w-sm overflow-hidden border-2 shadow-[0_12px_64px_rgba(0,0,0,0.08)]">
      <div className="border-border border-b">
        <div className="flex items-center justify-center gap-2 px-4 pt-3 pb-3">
          <Lock size={20} weight="fill" className="text-foreground" />
          <span className="text-foreground text-xl font-semibold">{domain}</span>
        </div>
        <div className="border-border grid grid-cols-3 border-t">
          <div className="border-border flex flex-col items-center gap-1 border-r px-2 py-3">
            <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
              {labels.scan}
            </span>
            <div className="flex items-center gap-1">
              <CheckCircle size={16} weight="fill" className="text-success" />
              <span className="text-foreground text-xs font-semibold">{labels.complete}</span>
            </div>
          </div>
          <div className="border-border flex flex-col items-center gap-1 border-r px-2 py-3">
            <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
              {labels.issues}
            </span>
            <div className="flex items-center gap-1">
              <Warning size={16} weight="fill" className="text-warning" />
              <span className="text-foreground text-xs font-semibold">{labels.issuesFound}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-3">
            <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
              {labels.privacyPolicy}
            </span>
            <div className="flex items-center gap-1">
              <WarningCircle size={16} weight="fill" className="text-danger" />
              <span className="text-foreground text-xs font-semibold">{labels.notCompliant}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center justify-between p-4${i < items.length - 1 ? 'border-border border-b' : ''}`}
          >
            <div className="flex items-center gap-3">
              <ScanItemIcon icon={item.icon} color={item.color} size={32} />
              <p className="text-foreground text-sm font-medium">{item.label}</p>
            </div>
            <Chip variant="secondary" color="default" size="sm">
              {item.value}
            </Chip>
          </div>
        ))}
      </div>
    </div>
  );
}
