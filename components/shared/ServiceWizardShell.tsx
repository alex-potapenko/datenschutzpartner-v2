'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
  useOverlayState,
} from '@/components/ui';
import { useSession } from '@/api/auth';
import { Container } from '@/components/shared/Container';
import { WizardTopBar } from '@/components/shared/topbars/WizardTopBar';
import type { ServiceBrandId } from '@/components/shared/topbars/service-brands';
import { NESTED_SCREEN_TRANSITION } from '@/components/shared/NestedScreenShell';

export function ServiceWizardShell({
  serviceLabel,
  serviceBrandId,
  quitHref,
  onQuit,
  faqHref,
  faqContent,
  quitDisabled = false,
  confirmQuit = true,
  showQuit = true,
  quitLabel,
  quitIconOnly = false,
  cancelTitle,
  cancelBody,
  cancelQuitLabel,
  cancelProceedLabel,
  faqLabel,
  faqShortLabel,
  children,
}: {
  serviceLabel: string;
  serviceBrandId?: ServiceBrandId;
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
  /** Overrides the leave button label — e.g. "Back" when the flow edits an existing document. */
  quitLabel?: string;
  /** Renders the leave control as a back caret instead of a labelled pill. */
  quitIconOnly?: boolean;
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
  const shouldReduceMotion = useReducedMotion();
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
      <WizardTopBar
        serviceLabel={serviceLabel}
        serviceBrandId={serviceBrandId}
        backLabel={tCommon('back')}
        showBack={showTopBarBack}
        onBack={() => {
          setFaqOpen(false);
        }}
        showQuit={showTopBarQuit}
        quitLabel={quitLabel ?? cancelQuitLabel}
        quitIconOnly={quitIconOnly}
        onQuit={handleQuitRequest}
        quitDisabled={quitDisabled}
        showFaqButton={showFaqButton}
        faqLabel={faqLabel}
        faqShortLabel={faqShortLabel}
        onFaqOpen={handleFaqOpen}
        showProfileMenu={isAuthenticated && !faqOpen}
        onLeaveRequest={confirmQuit && !quitDisabled ? handleQuitRequest : undefined}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {faqOpen && faqContent ? (
            <motion.div
              key="faq"
              className="min-h-0 flex-1 overflow-y-auto"
              initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
              transition={NESTED_SCREEN_TRANSITION}
            >
              <Container className="flex min-h-0 flex-1 flex-col">
                <div className="border-border min-h-0 flex-1 border-r border-l">{faqContent}</div>
              </Container>
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
              transition={NESTED_SCREEN_TRANSITION}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
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
