import Link from 'next/link';
import { CaretRight } from '@/components/ui';
import { Container } from './Container';

export function AboutSection() {
  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border relative flex items-start gap-24 border-r border-l p-8 pt-36">
          <div className="flex w-1/3 shrink-0 flex-col gap-6">
            <h2 className="text-foreground text-4xl font-bold">About us.</h2>
            <p className="text-foreground text-base leading-relaxed">
              With GDPR and the new Swiss Data Protection Act (DSG) in force since September 2023,
              we help companies, individuals and organisations navigate complex data protection law.
              We offer flexible, affordable solutions — from our Privacy Generator to our Academy,
              newsletter and podcast.
            </p>
            <div>
              <Link
                href="https://www.datenschutzpartner.ch/ueber-datenschutzpartner/"
                target="_blank"
                className="inline-flex items-center gap-1 text-base font-semibold transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent)' }}
              >
                Learn more <CaretRight size={16} />
              </Link>
            </div>
          </div>

          <div className="squircle flex-1 overflow-hidden">
            <img
              src="/team.png"
              alt="Datenschutzpartner team"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
