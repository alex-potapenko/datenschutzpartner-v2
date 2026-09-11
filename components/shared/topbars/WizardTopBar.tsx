'use client';

import type { ReactNode } from 'react';
import { Button, Question } from '@/components/ui';
import { AccountProfileMenu } from '@/components/shared/AccountProfileMenu';
import { Container } from '@/components/shared/Container';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { TOPBAR_ROW_PADDING } from './constants';
import { TopBarDivider } from './TopBarDivider';
import { TopBarFrame } from './TopBarFrame';
import { TopBarIconBackButton, topBarOutlineButtonClass } from './TopBarBackButton';
import { TopBarRoot } from './TopBarRoot';
import { TopBarTitle } from './TopBarTitle';
import { TopBarServiceMark, type ServiceBrandId } from './service-brands';

/** Service wizard flows — quit/back, service label, FAQ, locale, profile. */
export function WizardTopBar({
  serviceLabel,
  backLabel,
  showBack = false,
  onBack,
  showQuit = false,
  quitLabel,
  quitIconOnly = false,
  onQuit,
  quitDisabled = false,
  showFaqButton = false,
  faqLabel,
  faqShortLabel,
  onFaqOpen,
  showProfileMenu = false,
  onLeaveRequest,
  serviceBrandId,
}: {
  serviceLabel: string;
  serviceBrandId?: ServiceBrandId;
  backLabel: string;
  showBack?: boolean;
  onBack?: () => void;
  showQuit?: boolean;
  quitLabel?: string;
  /** Renders the leave control as a back caret instead of a labelled pill. */
  quitIconOnly?: boolean;
  onQuit?: () => void;
  quitDisabled?: boolean;
  showFaqButton?: boolean;
  faqLabel?: string;
  faqShortLabel?: string;
  onFaqOpen?: () => void;
  showProfileMenu?: boolean;
  onLeaveRequest?: () => void;
}) {
  return (
    <TopBarRoot sticky={false} trackHeight={false} className="shrink-0">
      <Container>
        <TopBarFrame layout="wizard-split">
          <div className={`flex w-1/2 min-w-0 items-center ${TOPBAR_ROW_PADDING} sm:px-8`}>
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              {showBack && onBack ? (
                <TopBarIconBackButton label={backLabel} onPress={onBack} />
              ) : null}
              {showQuit && quitLabel && onQuit ? (
                <>
                  {quitIconOnly ? (
                    <TopBarIconBackButton label={quitLabel} onPress={onQuit} />
                  ) : (
                    <Button
                      variant="outline"
                      size="md"
                      className={topBarOutlineButtonClass}
                      isDisabled={quitDisabled}
                      onPress={onQuit}
                    >
                      {quitLabel}
                    </Button>
                  )}
                  <TopBarDivider />
                </>
              ) : null}
              <div className="flex min-w-0 items-center gap-2.5">
                {serviceBrandId ? <TopBarServiceMark serviceId={serviceBrandId} /> : null}
                <TopBarTitle lowercase={!showBack}>{serviceLabel}</TopBarTitle>
              </div>
            </div>
          </div>
          <div
            className={`flex w-1/2 items-center justify-end gap-2 ${TOPBAR_ROW_PADDING} sm:gap-3 sm:px-8`}
          >
            <LocaleSwitcher />
            {showFaqButton && faqLabel && faqShortLabel && onFaqOpen ? (
              <Button
                variant="outline"
                size="md"
                className="gap-2 border-white/20 text-white hover:bg-white/10"
                onPress={onFaqOpen}
              >
                <Question size={16} weight="bold" />
                <span className="hidden sm:inline">{faqLabel}</span>
                <span className="sm:hidden">{faqShortLabel}</span>
              </Button>
            ) : null}
            {showProfileMenu ? <AccountProfileMenu onLeaveRequest={onLeaveRequest} /> : null}
          </div>
        </TopBarFrame>
      </Container>
    </TopBarRoot>
  );
}

/** Non-sticky accent strip used below the wizard top bar (domain, step progress). */
export function WizardTopBarAccentStrip({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 text-white" style={{ background: 'var(--accent)' }}>
      <Container>{children}</Container>
    </div>
  );
}
