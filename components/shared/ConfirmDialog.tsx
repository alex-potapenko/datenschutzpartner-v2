'use client';

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

type OverlayState = ReturnType<typeof useOverlayState>;

/** Confirmation dialog for destructive actions (cancel subscription, log out). */
export function ConfirmDialog({
  state,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending,
}: {
  state: OverlayState;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{title}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <p className="text-foreground text-sm leading-relaxed">{body}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  state.close();
                }}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--feature-red)]"
                isDisabled={isPending}
                onPress={onConfirm}
              >
                {confirmLabel}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
