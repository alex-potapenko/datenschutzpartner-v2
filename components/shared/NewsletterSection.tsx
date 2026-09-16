'use client';

import { Container } from './Container';
import { NewsletterSubscribePanel } from './NewsletterSubscribePanel';

export function NewsletterSection() {
  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border border-r border-l">
          <NewsletterSubscribePanel />
        </div>
      </Container>
    </section>
  );
}
