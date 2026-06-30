'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Sparkle } from '@/components/ui';
import { Button } from '@/components/ui';

interface ScanFormProps {
  dark?: boolean;
}

export function ScanForm({ dark }: ScanFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    router.push(`/result?url=${encodeURIComponent(normalized)}`);
  }

  return (
    <form
      id="scan-form"
      onSubmit={handleSubmit}
      className="flex items-center rounded-full bg-white py-3 pr-3 pl-6 shadow-[0_4px_32px_rgba(0,0,0,0.10)]"
    >
      <Globe
        size={24}
        weight="regular"
        className="mr-3 shrink-0"
        style={{ color: 'var(--accent)' }}
      />
      <input
        type="text"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
        }}
        placeholder="Enter your website"
        aria-label="Website URL"
        className={[
          'flex-1 bg-transparent text-lg font-semibold outline-none',
          dark
            ? 'text-white placeholder:text-white/40 focus:placeholder:text-transparent'
            : 'text-[var(--accent)] placeholder:text-[var(--accent)] focus:placeholder:text-transparent',
        ].join(' ')}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="h-14 shrink-0 gap-2 rounded-full px-8 text-lg"
        style={{
          border: '3px solid transparent',
          background:
            'linear-gradient(#2F5486, #2F5486) padding-box, linear-gradient(135deg, #ef4444, #f97316, #7c3aed, #3b82f6, #16a34a) border-box',
        }}
      >
        <Sparkle size={18} weight="fill" />
        Scan
      </Button>
    </form>
  );
}
