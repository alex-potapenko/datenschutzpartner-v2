'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatDiscountPercent, GENERATOR_VOLUME_DISCOUNT_TIERS } from '@/api/checkout';
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
  Tooltip,
  useOverlayState,
} from '@/components/ui';

export function VolumeDiscountTooltipContent() {
  const t = useTranslations('account.generatorCheckout');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground leading-relaxed">{t('discountThresholdsIntro')}</p>
      <ul className="flex flex-col gap-1">
        {GENERATOR_VOLUME_DISCOUNT_TIERS.map((tier) => (
          <li key={tier.minSites} className="text-foreground leading-snug">
            {tier.rate <= 0
              ? t('discountThresholdNone', { to: tier.maxSites ?? 3 })
              : tier.maxSites == null
                ? t('discountThresholdPlus', {
                    from: tier.minSites,
                    percent: formatDiscountPercent(tier.rate),
                  })
                : t('discountThresholdRange', {
                    from: tier.minSites,
                    to: tier.maxSites,
                    percent: formatDiscountPercent(tier.rate),
                  })}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VolumeDiscountInfoTooltip() {
  const t = useTranslations('account.generatorCheckout');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip delay={0} closeDelay={0} isOpen={isOpen} onOpenChange={setIsOpen}>
      <Tooltip.Trigger
        aria-label={t('discountThresholdsLabel')}
        className="text-accent hover:text-key-700 inline-flex shrink-0 cursor-pointer items-center justify-center"
        onPointerEnter={() => {
          setIsOpen(true);
        }}
        onPointerLeave={() => {
          setIsOpen(false);
        }}
      >
        <Info size={16} weight="bold" aria-hidden />
      </Tooltip.Trigger>
      <Tooltip.Content className="max-w-xs p-3 text-sm">
        <VolumeDiscountTooltipContent />
      </Tooltip.Content>
    </Tooltip>
  );
}

export function VolumeDiscountNote({ label, onOpen }: { label: ReactNode; onOpen: () => void }) {
  const t = useTranslations('account.generatorCheckout');

  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <button
        type="button"
        aria-label={t('discountThresholdsLabel')}
        className="text-accent hover:text-key-700 inline-flex cursor-pointer items-center justify-center"
        onClick={onOpen}
      >
        <Info size={16} weight="bold" aria-hidden />
      </button>
    </span>
  );
}

export function VolumeDiscountThresholdsDialog({
  state,
}: {
  state: ReturnType<typeof useOverlayState>;
}) {
  const t = useTranslations('account.generatorCheckout');

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('discountThresholdsLabel')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <VolumeDiscountTooltipContent />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="primary"
                onPress={() => {
                  state.close();
                }}
              >
                {t('discountThresholdsDone')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
