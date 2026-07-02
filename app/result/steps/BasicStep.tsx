import { Button } from '@/components/ui';
import { Lock } from '@/components/ui';
import { StepHeader } from '../ui/StepHeader';
import { Container } from '@/components/shared/Container';

const POLICY_PREVIEW = `§ 1 Controller

The controller responsible for data processing on this website under the GDPR is Datenschutzpartner AG, Hauptstrasse 19, 5742 Kölliken, Switzerland. You can reach our data protection officer at info@datenschutzpartner.ch.

§ 2 Google Analytics 4

This website uses Google Analytics 4, a web analytics service provided by Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland. Google Analytics uses cookies that are stored on your device and enable analysis of your use of the website.

§ 3 Cookies & Tracking Technologies

We use cookies and similar tracking technologies on our website. Cookies are small text files that are stored on your device. We use both session cookies, which are deleted after your browser session, and persistent cookies, which remain on your device for a longer period.

§ 4 Contact Form

When you contact us via our contact form, the data you provide (name, email address, message) will be stored by us for the purpose of processing your request and in case of follow-up questions.

§ 5 Hosting & Infrastructure

This website is hosted on servers located in the European Union. Your data will not be transferred to countries outside the EU/EEA without appropriate safeguards in place.

§ 6 Your Rights

You have the right to access, rectification, erasure, restriction of processing, data portability and to object to processing of your personal data at any time.`;

interface BasicStepProps {
  onUnlock: () => void;
  onImprove: () => void;
}

export function BasicStep({ onUnlock, onImprove }: BasicStepProps) {
  return (
    <>
      <StepHeader
        title="Your privacy policy draft."
        description="This draft is based on your website scan and may not cover all legal requirements."
      />
      <Container>
        <div className="border-border border-r border-l">
          <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-10 sm:px-8">
            <div
              className="relative overflow-hidden rounded-[20px] border"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="text-foreground space-y-4 p-4 text-sm leading-relaxed select-none sm:p-8"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 75%)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, black 0%, black 40%, transparent 75%)',
                }}
              >
                {POLICY_PREVIEW.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className={
                      para.startsWith('§')
                        ? 'text-foreground mt-4 font-semibold first:mt-0'
                        : 'text-muted'
                    }
                  >
                    {para}
                  </p>
                ))}
              </div>

              <div
                className="absolute right-0 bottom-0 left-0 flex flex-col items-center gap-6 px-4 pt-24 pb-10 sm:px-8"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.95) 30%, white 60%)',
                }}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div
                    className="mb-1 flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: 'rgba(47,84,134,0.08)' }}
                  >
                    <Lock size={18} weight="fill" style={{ color: 'var(--accent)' }} />
                  </div>
                  <p className="text-foreground text-base font-semibold">Full policy locked</p>
                  <p className="text-muted max-w-xs text-sm">
                    Unlock the complete, publish-ready version of your privacy policy.
                  </p>
                </div>

                <div className="flex w-full max-w-xs flex-col gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full rounded-full"
                    onPress={onUnlock}
                  >
                    Unlock full policy
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full"
                    onPress={onImprove}
                  >
                    Improve accuracy instead
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
