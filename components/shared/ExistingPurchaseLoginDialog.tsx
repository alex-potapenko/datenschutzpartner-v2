'use client';

import { useRouter } from 'next/navigation';
import {
  Button,
  CaretRight,
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
import { useTranslations } from 'next-intl';

type OverlayState = ReturnType<typeof useOverlayState>;

type ExistingPurchaseLoginDialogProps = {
  state: OverlayState;
  variant: 'site' | 'euRep';
  displayName: string;
  mode: 'guest' | 'logged';
  returnTo?: string;
  entityHref?: string;
};

export function ExistingPurchaseLoginDialog({
  state,
  variant,
  displayName,
  mode,
  returnTo,
  entityHref,
}: ExistingPurchaseLoginDialogProps) {
  const t = useTranslations('existingPurchase');
  const router = useRouter();

  const title = variant === 'site' ? t('siteTitle') : t('euRepTitle');

  function renderBody() {
    if (variant === 'site') {
      return mode === 'logged'
        ? t('siteBodyLogged', { site: displayName })
        : t('siteBody', { site: displayName });
    }

    if (mode === 'logged') {
      return (
        <>
          {t('euRepBodyLoggedPrefix')}
          <span className="font-semibold">{displayName}</span>
          {t('euRepBodyLoggedSuffix')}
        </>
      );
    }

    return t('euRepBody', { legalEntity: displayName });
  }

  const primaryLabel =
    mode === 'logged' ? (variant === 'site' ? t('goToSite') : t('goToContract')) : t('logIn');

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{title}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <p className="text-foreground text-sm leading-relaxed">{renderBody()}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  state.close();
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="primary"
                className="gap-2"
                onPress={() => {
                  state.close();
                  if (mode === 'logged' && entityHref) {
                    router.push(entityHref);
                    return;
                  }
                  if (returnTo) {
                    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
                  }
                }}
              >
                {primaryLabel}
                <CaretRight size={16} weight="bold" aria-hidden />
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
