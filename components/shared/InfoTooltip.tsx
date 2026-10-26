'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Button,
  Info,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalRoot,
  useOverlayState,
} from '@/components/ui';

/** Info icon that opens supporting copy in a dialog on press. */
export function InfoTooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  contentClassName?: string;
  className?: string;
}) {
  const tCommon = useTranslations('common');
  const state = useOverlayState();

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        className={cn(
          'text-muted hover:text-foreground inline-flex h-[14px] w-[14px] shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 align-middle leading-none outline-none',
          className
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          state.open();
        }}
      >
        <Info size={14} weight="bold" aria-hidden />
      </button>
      <ModalRoot state={state}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{label}</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <div className="text-foreground text-sm leading-relaxed">
                  {typeof children === 'string' ? <p>{children}</p> : children}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="primary"
                  onPress={() => {
                    state.close();
                  }}
                >
                  {tCommon('close')}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>
    </>
  );
}
