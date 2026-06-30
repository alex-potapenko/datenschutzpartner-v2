'use client';

import React from 'react';
import { Button } from '@/components/ui';
import {
  ArrowRight,
  Star,
  Crown,
  Briefcase,
  ShieldCheck,
  FileText,
  EnvelopeSimple,
  Mailbox,
  Newspaper,
  MicrophoneStage,
  Buildings,
} from '@/components/ui';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { Container } from '@/components/shared/Container';

interface EuRepStepProps {
  onSelect: (plan: 'budget' | 'standard' | 'premium') => void;
  onBack?: () => void;
}

interface Plan {
  id: 'budget' | 'standard' | 'premium';
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  inquiryLabel: string;
  inquiryHint: string;
  price: string;
  ctaLabel: string;
  ctaVariant: 'outline' | 'primary';
}

const SHARED_FEATURES = [
  { icon: <Buildings size={24} weight="fill" />, text: 'EU Representative based in Germany' },
  {
    icon: <ShieldCheck size={24} weight="fill" />,
    text: (
      <>
        Compliance with{' '}
        <a
          href="https://gdpr-info.eu/art-27-gdpr/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          Art. 27 GDPR
        </a>
      </>
    ),
  },
  {
    icon: <FileText size={24} weight="fill" />,
    text: 'Mention in privacy policy & legal notice',
  },
  {
    icon: <FileText size={24} weight="fill" />,
    text: 'Mention in records of processing activities',
  },
  { icon: <EnvelopeSimple size={24} weight="fill" />, text: 'Reachable via email' },
  { icon: <Mailbox size={24} weight="fill" />, text: 'Reachable via postal mail' },
  {
    icon: <Newspaper size={24} weight="fill" />,
    text: 'Newsletter on privacy updates and tips',
  },
  {
    icon: <MicrophoneStage size={24} weight="fill" />,
    text: '«Datenschutz Plaudereien» podcast',
  },
];

const PLANS: Plan[] = [
  {
    id: 'budget',
    name: 'Budget',
    description: 'Minimal compliance setup. Pay per inquiry as needed.',
    icon: <Briefcase size={24} weight="fill" />,
    iconBg: 'rgba(22,163,74,0.08)',
    iconColor: '#16a34a',
    inquiryLabel: 'Review & forwarding of inquiries',
    inquiryHint: 'CHF 99.00 per inquiry',
    price: '149.00',
    ctaLabel: 'Choose Budget',
    ctaVariant: 'outline',
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Best for occasional contact from EU users.',
    icon: <Star size={24} weight="fill" />,
    iconBg: 'rgba(59,130,246,0.08)',
    iconColor: '#3b82f6',
    inquiryLabel: 'Review & forwarding of inquiries',
    inquiryHint: '1 inquiry / year included',
    price: '249.00',
    ctaLabel: 'Choose Standard',
    ctaVariant: 'primary',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For active EU customer base with higher inquiry volume.',
    icon: <Crown size={24} weight="fill" />,
    iconBg: 'rgba(168,85,247,0.08)',
    iconColor: '#a855f7',
    inquiryLabel: 'Review & forwarding of inquiries',
    inquiryHint: '5 inquiries / year included',
    price: '499.00',
    ctaLabel: 'Choose Premium',
    ctaVariant: 'outline',
  },
];

export function EuRepStep({ onSelect, onBack }: EuRepStepProps) {
  return (
    <>
      <StepHeader
        title="Choose your EU Representative plan."
        description={
          <>
            Under{' '}
            <a
              href="https://gdpr-info.eu/art-27-gdpr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              GDPR Article 27
            </a>
            , an EU Representative acts as your contact point in the European Union for data
            subjects and supervisory authorities.
          </>
        }
      />

      {/* Shared features */}
      <div className="border-border border-b">
        <Container>
          <div className="border-border flex flex-col gap-8 border-r border-l p-8">
            <h2 className="text-foreground text-xl font-semibold">Included in all plans</h2>
            <div className="grid grid-cols-4 gap-8">
              {SHARED_FEATURES.map((f, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <span
                    className="text-muted"
                    style={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {f.icon}
                  </span>
                  <span className="text-foreground text-base leading-snug">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* Plans */}
      <Container className="flex flex-1 flex-col">
        <div
          className="border-border grid flex-1 grid-cols-3 border-r border-l"
          style={{ gridTemplateRows: 'auto auto auto' }}
        >
          {/* Headers */}
          {PLANS.map((plan, i) => (
            <div
              key={`header-${plan.id}`}
              className={`flex flex-col gap-3 p-8 ${i < PLANS.length - 1 ? 'border-border border-r' : ''}`}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: plan.iconBg, color: plan.iconColor }}
              >
                {plan.icon}
              </div>
              <h2 className="text-foreground mt-3 text-xl font-semibold">{plan.name}</h2>
              <p className="text-muted text-base leading-relaxed">{plan.description}</p>
            </div>
          ))}

          {/* Unique feature */}
          {PLANS.map((plan, i) => (
            <div
              key={`feature-${plan.id}`}
              className={`px-8 pb-6 ${i < PLANS.length - 1 ? 'border-border border-r' : ''}`}
            >
              <span className="text-foreground text-base leading-snug">
                {plan.inquiryLabel}
                <br />
                {plan.inquiryHint}
              </span>
            </div>
          ))}

          {/* CTAs */}
          {PLANS.map((plan, i) => (
            <div
              key={`cta-${plan.id}`}
              className={`flex flex-col gap-3 p-8 pt-4 ${i < PLANS.length - 1 ? 'border-border border-r' : ''}`}
            >
              <Button
                variant={plan.ctaVariant}
                size="lg"
                className="h-14 w-full gap-2 rounded-full"
                onPress={() => {
                  onSelect(plan.id);
                }}
              >
                {plan.ctaLabel}
                <ArrowRight size={16} weight="bold" />
              </Button>
              <p className="text-center">
                <span className="text-foreground text-base font-medium">CHF </span>
                <span className="text-foreground text-xl font-medium">{plan.price}</span>
                <span className="text-muted text-base font-normal"> / 12 months</span>
              </p>
            </div>
          ))}
        </div>
      </Container>

      <StepFooter onBack={onBack} />
    </>
  );
}
