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
    <div
      className="squircle relative w-full max-w-sm overflow-hidden"
      style={{
        border: '2px solid rgba(255,255,255,1)',
        background: 'rgba(255,255,255,0.6)',
        boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-center gap-2 px-4 pt-3 pb-3">
          <Lock size={20} weight="fill" className="text-foreground" />
          <span className="text-foreground text-xl font-semibold">{domain}</span>
        </div>
        <div className="grid grid-cols-3" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <div
            className="flex flex-col items-center gap-1 px-2 py-3"
            style={{ borderRight: '1px solid rgba(0,0,0,0.08)' }}
          >
            <span className="text-muted text-[10px] font-semibold tracking-wide uppercase">
              {labels.scan}
            </span>
            <div className="flex items-center gap-1" style={{ color: '#16a34a' }}>
              <CheckCircle size={16} weight="fill" />
              <span className="text-xs font-medium">{labels.complete}</span>
            </div>
          </div>
          <div
            className="flex flex-col items-center gap-1 px-2 py-3"
            style={{ borderRight: '1px solid rgba(0,0,0,0.08)' }}
          >
            <span className="text-muted text-[10px] font-semibold tracking-wide uppercase">
              {labels.issues}
            </span>
            <div className="flex items-center gap-1" style={{ color: '#d97706' }}>
              <Warning size={16} weight="fill" />
              <span className="text-xs font-medium">{labels.issuesFound}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-3">
            <span className="text-muted text-[10px] font-semibold tracking-wide uppercase">
              {labels.privacyPolicy}
            </span>
            <div className="flex items-center gap-1" style={{ color: '#ef4444' }}>
              <WarningCircle size={16} weight="fill" />
              <span className="text-xs font-medium">{labels.notCompliant}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        {items.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-4"
            style={
              i < items.length - 1 ? { borderBottom: '1px solid rgba(0,0,0,0.08)' } : undefined
            }
          >
            <div className="flex items-center gap-3">
              <ScanItemIcon icon={item.icon} color={item.color} size={32} />
              <p className="text-foreground text-sm font-medium">{item.label}</p>
            </div>
            <Chip
              variant="soft"
              color={
                item.value.toLowerCase().includes('update')
                  ? 'danger'
                  : item.value.toLowerCase().includes('detected') ||
                      item.value.toLowerCase().includes('erkannt')
                    ? 'warning'
                    : 'success'
              }
              size="sm"
            >
              {item.value}
            </Chip>
          </div>
        ))}
      </div>
    </div>
  );
}
