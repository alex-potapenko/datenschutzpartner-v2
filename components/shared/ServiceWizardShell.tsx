'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Button,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  Question,
  useOverlayState,
} from '@/components/ui';
import { useSession } from '@/api/auth';
import { Container } from '@/components/shared/Container';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { AccountProfileMenu } from '@/components/shared/AccountProfileMenu';

export function ServiceWizardShell({
  serviceLabel,
  quitHref,
  onQuit,
  faqHref,
  faqContent,
  quitDisabled = false,
  confirmQuit = true,
  showQuit = true,
  cancelTitle,
  cancelBody,
  cancelQuitLabel,
  cancelProceedLabel,
  faqLabel,
  faqShortLabel,
  children,
}: {
  serviceLabel: string;
  quitHref: string;
  onQuit?: () => void;
  faqHref?: string;
  /** Inline FAQ screen — opens in the wizard shell with a Back control in the top bar. */
  faqContent?: ReactNode;
  quitDisabled?: boolean;
  /** When false, Quit leaves immediately without the cancel modal. */
  confirmQuit?: boolean;
  /** When false, hides Quit on the left. */
  showQuit?: boolean;
  cancelTitle: string;
  cancelBody: string;
  cancelQuitLabel: string;
  cancelProceedLabel: string;
  faqLabel: string;
  faqShortLabel: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const modal = useOverlayState();
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.email);
  const [faqOpen, setFaqOpen] = useState(false);

  const showFaqButton = Boolean(faqContent || faqHref) && !faqOpen;
  const showTopBarBack = faqOpen;
  const showTopBarQuit = showQuit && !faqOpen;

  function handleQuit() {
    onQuit?.();
    window.location.href = quitHref;
  }

  function handleQuitRequest() {
    if (quitDisabled) return;
    if (confirmQuit) {
      modal.open();
    } else {
      handleQuit();
    }
  }

  function handleFaqOpen() {
    if (faqContent) {
      setFaqOpen(true);
      return;
    }
    if (faqHref) {
      router.push(faqHref);
    }
  }

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      <div className="shrink-0 text-white" style={{ background: 'var(--accent)' }}>
        <Container>
          <div className="flex items-center border-r border-l border-white/20">
            <div className="flex w-1/2 min-w-0 items-center px-4 py-5 sm:px-8">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                {showTopBarBack ? (
                  <Button
                    variant="outline"
                    size="md"
                    className="border-white/20 text-white hover:bg-white/10"
                    onPress={() => {
                      setFaqOpen(false);
                    }}
                  >
                    {tCommon('back')}
                  </Button>
                ) : null}
                {showTopBarQuit ? (
                  <Button
                    variant="outline"
                    size="md"
                    className="border-white/20 text-white hover:bg-white/10"
                    isDisabled={quitDisabled}
                    onPress={handleQuitRequest}
                  >
                    {cancelQuitLabel}
                  </Button>
                ) : null}
                {showTopBarBack || showTopBarQuit ? (
                  <div aria-hidden className="h-6 w-px shrink-0 bg-white/20" />
                ) : null}
                <span className="font-display flex min-w-0 items-center truncate text-sm leading-none font-medium tracking-tight text-white lowercase">
                  {serviceLabel}
                </span>
              </div>
            </div>
            <div className="flex w-1/2 items-center justify-end gap-2 px-4 py-5 sm:gap-3 sm:px-8">
              <LocaleSwitcher />
              {showFaqButton ? (
                <Button
                  variant="outline"
                  size="md"
                  className="gap-2 border-white/20 text-white hover:bg-white/10"
                  onPress={handleFaqOpen}
                >
                  <Question size={16} weight="bold" />
                  <span className="hidden sm:inline">{faqLabel}</span>
                  <span className="sm:hidden">{faqShortLabel}</span>
                </Button>
              ) : null}
              {isAuthenticated ? (
                <AccountProfileMenu
                  onLeaveRequest={confirmQuit && !quitDisabled ? handleQuitRequest : undefined}
                />
              ) : null}
            </div>
          </div>
        </Container>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {faqOpen && faqContent ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Container className="flex min-h-0 flex-1 flex-col">
              <div className="border-border min-h-0 flex-1 border-r border-l px-4 py-8 sm:px-8 sm:py-10 lg:py-12">
                {faqContent}
              </div>
            </Container>
          </div>
        ) : (
          children
        )}
      </div>

      <ModalRoot state={modal}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{cancelTitle}</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p className="text-foreground text-sm leading-relaxed">{cancelBody}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  className="text-danger"
                  isDisabled={quitDisabled}
                  onPress={handleQuit}
                >
                  {cancelQuitLabel}
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    modal.close();
                  }}
                >
                  {cancelProceedLabel}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>
    </div>
  );
}
