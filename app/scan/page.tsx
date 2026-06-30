'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { TopBar } from '@/components/shared/TopBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { Section } from '@/components/shared/Section';

export default function ScanPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL.');
      return;
    }

    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;

    try {
      new URL(normalized);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }

    setError('');
    setScanning(true);

    setTimeout(() => {
      router.push(`/result?url=${encodeURIComponent(normalized)}`);
    }, 2500);
  }

  return (
    <>
      <TopBar />
      <main className="flex min-h-[calc(100vh-128px)] flex-col">
        <Section as="div" className="flex flex-1 items-center">
          <Container>
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-foreground mb-3 text-3xl font-bold">Scan your website</h1>
              <p className="text-muted mb-10">
                Enter your website URL. The scan takes only a few seconds.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="url-input"
                    className="text-foreground text-left text-sm font-medium"
                  >
                    Website URL
                  </label>
                  <Input
                    id="url-input"
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. mywebsite.com"
                    disabled={scanning}
                    aria-invalid={!!error || undefined}
                    aria-describedby={error ? 'url-error' : undefined}
                    fullWidth
                  />
                </div>
                {error && (
                  <p id="url-error" className="text-danger text-sm">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isDisabled={scanning}
                  className="w-full"
                >
                  {scanning ? (
                    <span className="flex items-center gap-2">
                      <ScannerIcon />
                      Scanning…
                    </span>
                  ) : (
                    'Scan now'
                  )}
                </Button>
              </form>

              {scanning && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-2 animate-pulse rounded-full"
                        style={{ backgroundColor: 'var(--accent)', animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-muted text-sm">Analysing — detecting trackers and services…</p>
                </div>
              )}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function ScannerIcon() {
  return (
    <svg
      className="size-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
