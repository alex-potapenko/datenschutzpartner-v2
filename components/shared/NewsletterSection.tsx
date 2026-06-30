'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { EnvelopeSimple } from '@/components/ui';
import { Container } from './Container';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border relative flex flex-col items-center gap-12 overflow-hidden border-r border-l px-8 py-20 text-center">
          <img
            src="/dsp-mark-outline.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute select-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, calc(-50% + 10px))',
              width: 960,
              height: 960,
              opacity: 0.5,
              zIndex: 1,
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              top: '-20%',
              left: '-5%',
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: '#ef4444',
              opacity: 0.08,
              filter: 'blur(96px)',
              zIndex: 0,
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              bottom: '-20%',
              left: '20%',
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: '#7c3aed',
              opacity: 0.08,
              filter: 'blur(96px)',
              zIndex: 0,
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              top: '-20%',
              right: '15%',
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: '#3b82f6',
              opacity: 0.08,
              filter: 'blur(96px)',
              zIndex: 0,
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              bottom: '-20%',
              right: '-5%',
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: '#16a34a',
              opacity: 0.08,
              filter: 'blur(96px)',
              zIndex: 0,
            }}
          />

          <div className="relative z-10 flex max-w-2xl flex-col gap-4">
            <h2 className="text-foreground text-4xl font-bold">Stay ahead of privacy law.</h2>
            <p className="text-foreground text-base leading-relaxed whitespace-nowrap">
              Get practical insights on GDPR, the Swiss DSG, and data protection compliance
              delivered to your inbox.
              <br />
              No spam, unsubscribe anytime.
            </p>
          </div>

          <div className="relative z-10 w-full max-w-xl shrink-0">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: 'rgba(47,84,134,0.08)' }}
                >
                  <EnvelopeSimple size={24} weight="fill" style={{ color: 'var(--accent)' }} />
                </div>
                <p className="text-foreground text-base font-semibold">You&apos;re subscribed!</p>
                <p className="text-muted text-sm">We&apos;ll be in touch soon.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 rounded-full bg-white p-2 pl-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  placeholder="Your email address"
                  required
                  className="text-foreground placeholder:text-muted flex-1 bg-transparent text-base outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="shrink-0 gap-2 rounded-full"
                >
                  Subscribe
                </Button>
              </form>
            )}
            <p className="text-muted mt-3 text-center text-xs">
              By subscribing you agree to our{' '}
              <a href="/privacy" className="underline transition-opacity hover:opacity-70">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
