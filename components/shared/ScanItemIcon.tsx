import { type ReactNode } from 'react';

interface ScanItemIconProps {
  icon: ReactNode;
  color: string;
  size?: number;
}

export function ScanItemIcon({ icon, color, size = 36 }: ScanItemIconProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}20`,
        color,
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: `inset 0 0 12px 0 ${color}33, 0 0 20px 0 rgba(255,255,255,0.6)`,
        backdropFilter: 'blur(12px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
        isolation: 'isolate',
      }}
    >
      {icon}
    </div>
  );
}
