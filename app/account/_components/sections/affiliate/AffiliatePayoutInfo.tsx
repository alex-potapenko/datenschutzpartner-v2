'use client';

import { useTranslations } from 'next-intl';
import { useAffiliateProgramSettings, type AffiliateDashboard } from '@/api/affiliate';
import { NavigationLink } from '@/components/shared/NavigationLink';
import {
  Button,
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

export function AffiliatePayoutInfoBody({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.payoutInfo');
  const settings = useAffiliateProgramSettings();
  const months = settings.data?.payoutCadenceMonths ?? 3;

  const threshold = dashboard.payoutThresholdChf.toFixed(0);
  const email = dashboard.partner.notificationEmail;

  return (
    <ol className="text-foreground list-decimal space-y-2 pl-5 text-sm leading-relaxed">
      <li>{t('steps.settlement', { months })}</li>
      <li>{t('steps.invoice')}</li>
      <li>{t('steps.threshold', { threshold })}</li>
      <li>{t('steps.email', { email })}</li>
    </ol>
  );
}

/** Header action — opens payout process details (replaces inline alert). */
export function AffiliatePayoutHowItWorksAction({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.payoutInfo');
  const tCommon = useTranslations('common');
  const state = useOverlayState();

  return (
    <>
      <NavigationLink
        size="sm"
        chevron="none"
        onPress={() => {
          state.open();
        }}
      >
        {t('actionLabel')}
      </NavigationLink>
      <ModalRoot state={state}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{t('title')}</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <AffiliatePayoutInfoBody dashboard={dashboard} />
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
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
